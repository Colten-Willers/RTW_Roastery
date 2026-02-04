from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: User

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    origin: str
    price: float
    image_url: str
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomBlend(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    origin: str
    roast_level: str  # light, medium, dark
    grind_size: str  # whole_bean, fine, medium, coarse
    blend_components: Dict[str, int]  # {"colombian": 50, "ethiopian": 50}
    quantity: int  # in grams
    price: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomBlendCreate(BaseModel):
    name: str
    origin: str
    roast_level: str
    grind_size: str
    blend_components: Dict[str, int]
    quantity: int

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: Optional[str] = None
    custom_blend_id: Optional[str] = None
    quantity: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemCreate(BaseModel):
    product_id: Optional[str] = None
    custom_blend_id: Optional[str] = None
    quantity: int = 1

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[Dict]
    total_amount: float
    status: str = "pending"  # pending, processing, shipped, delivered, cancelled
    payment_status: str = "pending"  # pending, paid, failed
    shipping_address: Dict
    session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[Dict]
    total_amount: float
    shipping_address: Dict
    guest_email: Optional[str] = None

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    custom_blend_id: str
    frequency: str  # weekly, biweekly, monthly
    status: str = "active"  # active, paused, cancelled
    next_delivery: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionCreate(BaseModel):
    custom_blend_id: str
    frequency: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    order_id: str
    session_id: str
    amount: float
    currency: str
    payment_status: str = "pending"
    metadata: Dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShippingRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    region: str
    rate: float
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShippingRateCreate(BaseModel):
    region: str
    rate: float
    description: str

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user_data is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        if isinstance(user_data.get('created_at'), str):
            user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
        
        return User(**user_data)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_input: UserCreate):
    existing_user = await db.users.find_one({"email": user_input.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(email=user_input.email, name=user_input.name)
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['password_hash'] = hash_password(user_input.password)
    
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user.id})
    return TokenResponse(token=token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_input: UserLogin):
    user_data = await db.users.find_one({"email": user_input.email}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_input.password, user_data.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_data.get('created_at'), str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
    
    user_data.pop('password_hash', None)
    user = User(**user_data)
    
    token = create_access_token({"sub": user.id})
    return TokenResponse(token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ PRODUCT ROUTES ============

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.post("/products", response_model=Product)
async def create_product(product_input: Product, current_user: User = Depends(get_current_user)):
    product_dict = product_input.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    await db.products.insert_one(product_dict)
    return product_input

# ============ CUSTOM BLEND ROUTES ============

@api_router.post("/custom-blends", response_model=CustomBlend)
async def create_custom_blend(blend_input: CustomBlendCreate, current_user: User = Depends(get_current_user)):
    # Calculate price based on quantity and components
    base_price_per_gram = 0.05
    total_price = blend_input.quantity * base_price_per_gram
    
    blend = CustomBlend(
        user_id=current_user.id,
        name=blend_input.name,
        origin=blend_input.origin,
        roast_level=blend_input.roast_level,
        grind_size=blend_input.grind_size,
        blend_components=blend_input.blend_components,
        quantity=blend_input.quantity,
        price=total_price
    )
    
    blend_dict = blend.model_dump()
    blend_dict['created_at'] = blend_dict['created_at'].isoformat()
    await db.custom_blends.insert_one(blend_dict)
    
    return blend

@api_router.get("/custom-blends", response_model=List[CustomBlend])
async def get_custom_blends(current_user: User = Depends(get_current_user)):
    blends = await db.custom_blends.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for blend in blends:
        if isinstance(blend.get('created_at'), str):
            blend['created_at'] = datetime.fromisoformat(blend['created_at'])
    return blends

@api_router.get("/custom-blends/{blend_id}", response_model=CustomBlend)
async def get_custom_blend(blend_id: str, current_user: User = Depends(get_current_user)):
    blend = await db.custom_blends.find_one({"id": blend_id, "user_id": current_user.id}, {"_id": 0})
    if not blend:
        raise HTTPException(status_code=404, detail="Blend not found")
    if isinstance(blend.get('created_at'), str):
        blend['created_at'] = datetime.fromisoformat(blend['created_at'])
    return CustomBlend(**blend)

# ============ CART ROUTES ============

@api_router.post("/cart", response_model=CartItem)
async def add_to_cart(item_input: CartItemCreate, current_user: User = Depends(get_current_user)):
    cart_item = CartItem(
        user_id=current_user.id,
        product_id=item_input.product_id,
        custom_blend_id=item_input.custom_blend_id,
        quantity=item_input.quantity
    )
    
    cart_dict = cart_item.model_dump()
    cart_dict['created_at'] = cart_dict['created_at'].isoformat()
    await db.cart.insert_one(cart_dict)
    
    return cart_item

@api_router.get("/cart", response_model=List[CartItem])
async def get_cart(current_user: User = Depends(get_current_user)):
    cart_items = await db.cart.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for item in cart_items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return cart_items

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, current_user: User = Depends(get_current_user)):
    result = await db.cart.delete_one({"id": item_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.cart.delete_many({"user_id": current_user.id})
    return {"message": "Cart cleared"}

# ============ ORDER ROUTES ============

@api_router.post("/orders", response_model=Order)
async def create_order(order_input: OrderCreate, current_user: Optional[User] = None):
    # Allow guest orders
    user_id = current_user.id if current_user else (order_input.guest_email or "guest")
    
    order = Order(
        user_id=user_id,
        items=order_input.items,
        total_amount=order_input.total_amount,
        shipping_address=order_input.shipping_address
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['updated_at'] = order_dict['updated_at'].isoformat()
    if order_input.guest_email:
        order_dict['guest_email'] = order_input.guest_email
    await db.orders.insert_one(order_dict)
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return Order(**order)

# ============ SUBSCRIPTION ROUTES ============

@api_router.post("/subscriptions", response_model=Subscription)
async def create_subscription(sub_input: SubscriptionCreate, current_user: User = Depends(get_current_user)):
    # Calculate next delivery based on frequency
    frequency_days = {"weekly": 7, "biweekly": 14, "monthly": 30}
    next_delivery = datetime.now(timezone.utc) + timedelta(days=frequency_days.get(sub_input.frequency, 30))
    
    subscription = Subscription(
        user_id=current_user.id,
        custom_blend_id=sub_input.custom_blend_id,
        frequency=sub_input.frequency,
        next_delivery=next_delivery
    )
    
    sub_dict = subscription.model_dump()
    sub_dict['created_at'] = sub_dict['created_at'].isoformat()
    sub_dict['next_delivery'] = sub_dict['next_delivery'].isoformat()
    await db.subscriptions.insert_one(sub_dict)
    
    return subscription

@api_router.get("/subscriptions", response_model=List[Subscription])
async def get_subscriptions(current_user: User = Depends(get_current_user)):
    subscriptions = await db.subscriptions.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for sub in subscriptions:
        if isinstance(sub.get('created_at'), str):
            sub['created_at'] = datetime.fromisoformat(sub['created_at'])
        if isinstance(sub.get('next_delivery'), str):
            sub['next_delivery'] = datetime.fromisoformat(sub['next_delivery'])
    return subscriptions

@api_router.patch("/subscriptions/{sub_id}")
async def update_subscription_status(sub_id: str, status: str, current_user: User = Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"id": sub_id, "user_id": current_user.id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription updated"}

# ============ PAYMENT ROUTES ============

@api_router.post("/checkout/session", response_model=CheckoutSessionResponse)
async def create_checkout_session(checkout_req: CheckoutRequest, current_user: User = Depends(get_current_user)):
    # Get order details
    order = await db.orders.find_one({"id": checkout_req.order_id, "user_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Initialize Stripe checkout
    webhook_url = f"{checkout_req.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create success and cancel URLs
    success_url = f"{checkout_req.origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_req.origin_url}/checkout/cancel"
    
    # Create checkout session
    session_request = CheckoutSessionRequest(
        amount=order['total_amount'],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order['id'],
            "user_id": current_user.id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(session_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        user_id=current_user.id,
        order_id=order['id'],
        session_id=session.session_id,
        amount=order['total_amount'],
        currency="usd",
        payment_status="pending",
        metadata=session_request.metadata
    )
    
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    trans_dict['updated_at'] = trans_dict['updated_at'].isoformat()
    await db.payment_transactions.insert_one(trans_dict)
    
    # Update order with session_id
    await db.orders.update_one(
        {"id": order['id']},
        {"$set": {"session_id": session.session_id}}
    )
    
    return session

@api_router.get("/checkout/status/{session_id}", response_model=CheckoutStatusResponse)
async def get_checkout_status(session_id: str, current_user: User = Depends(get_current_user)):
    # Check if we already processed this payment
    transaction = await db.payment_transactions.find_one({"session_id": session_id, "user_id": current_user.id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already paid, return cached status
    if transaction.get('payment_status') == 'paid':
        return CheckoutStatusResponse(
            status='complete',
            payment_status='paid',
            amount_total=int(transaction['amount'] * 100),
            currency=transaction['currency'],
            metadata=transaction['metadata']
        )
    
    # Otherwise, check with Stripe
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction and order if paid
    if status.payment_status == 'paid' and transaction.get('payment_status') != 'paid':
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": "paid",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        await db.orders.update_one(
            {"id": transaction['order_id']},
            {"$set": {
                "payment_status": "paid",
                "status": "processing",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return status

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.payment_status == 'paid':
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id}, {"_id": 0})
            if transaction and transaction.get('payment_status') != 'paid':
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                await db.orders.update_one(
                    {"id": transaction['order_id']},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "processing",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ============ SHIPPING ROUTES ============

@api_router.get("/shipping/rates", response_model=List[ShippingRate])
async def get_shipping_rates():
    rates = await db.shipping_rates.find({}, {"_id": 0}).to_list(1000)
    for rate in rates:
        if isinstance(rate.get('created_at'), str):
            rate['created_at'] = datetime.fromisoformat(rate['created_at'])
    return rates

@api_router.post("/shipping/rates", response_model=ShippingRate)
async def create_shipping_rate(rate_input: ShippingRateCreate, current_user: User = Depends(get_current_user)):
    # In production, add admin check here
    rate = ShippingRate(**rate_input.model_dump())
    rate_dict = rate.model_dump()
    rate_dict['created_at'] = rate_dict['created_at'].isoformat()
    await db.shipping_rates.insert_one(rate_dict)
    return rate

# ============ ADMIN ROUTES ============

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(current_user: User = Depends(get_current_user)):
    # In production, add admin check here
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.patch("/admin/orders/{order_id}")
async def update_order_status(order_id: str, status: str, current_user: User = Depends(get_current_user)):
    # In production, add admin check here
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order updated"}

# Root route
@api_router.get("/")
async def root():
    return {"message": "RTW's Roastery Coffee API"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()