import requests
import sys
import json
from datetime import datetime

class CoffeeAPITester:
    def __init__(self, base_url="https://bean-boutique-15.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test("Root API", "GET", "", 200)
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            return False
            
        # Try to login with the registered user
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        return success

    def test_get_user_profile(self):
        """Test getting current user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_products(self):
        """Test getting products list"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        return success

    def test_create_custom_blend(self):
        """Test creating a custom coffee blend"""
        blend_data = {
            "name": "Test Morning Blend",
            "origin": "ethiopian",
            "roast_level": "medium",
            "grind_size": "medium",
            "blend_components": {"ethiopian": 100},
            "quantity": 500
        }
        
        success, response = self.run_test(
            "Create Custom Blend",
            "POST",
            "custom-blends",
            200,
            data=blend_data
        )
        
        if success and 'id' in response:
            self.blend_id = response['id']
            return True
        return False

    def test_get_custom_blends(self):
        """Test getting user's custom blends"""
        success, response = self.run_test(
            "Get Custom Blends",
            "GET",
            "custom-blends",
            200
        )
        return success

    def test_add_to_cart(self):
        """Test adding custom blend to cart"""
        if not hasattr(self, 'blend_id'):
            return False
            
        cart_data = {
            "custom_blend_id": self.blend_id,
            "quantity": 1
        }
        
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "cart",
            200,
            data=cart_data
        )
        
        if success and 'id' in response:
            self.cart_item_id = response['id']
            return True
        return False

    def test_get_cart(self):
        """Test getting cart items"""
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        return success

    def test_create_order(self):
        """Test creating an order"""
        order_data = {
            "items": [
                {
                    "custom_blend_id": getattr(self, 'blend_id', 'test-id'),
                    "quantity": 1,
                    "details": {"name": "Test Blend", "price": 25.0}
                }
            ],
            "total_amount": 35.0,
            "shipping_address": {
                "name": "Test User",
                "address": "123 Test St",
                "city": "Test City",
                "state": "TS",
                "zip": "12345",
                "country": "US"
            }
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.order_id = response['id']
            return True
        return False

    def test_get_orders(self):
        """Test getting user orders"""
        success, response = self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200
        )
        return success

    def test_create_subscription(self):
        """Test creating a subscription"""
        if not hasattr(self, 'blend_id'):
            return False
            
        sub_data = {
            "custom_blend_id": self.blend_id,
            "frequency": "monthly"
        }
        
        success, response = self.run_test(
            "Create Subscription",
            "POST",
            "subscriptions",
            200,
            data=sub_data
        )
        
        if success and 'id' in response:
            self.subscription_id = response['id']
            return True
        return False

    def test_get_subscriptions(self):
        """Test getting user subscriptions"""
        success, response = self.run_test(
            "Get Subscriptions",
            "GET",
            "subscriptions",
            200
        )
        return success

    def test_get_shipping_rates(self):
        """Test getting shipping rates"""
        success, response = self.run_test(
            "Get Shipping Rates",
            "GET",
            "shipping/rates",
            200
        )
        return success

    def test_create_checkout_session(self):
        """Test creating Stripe checkout session"""
        if not hasattr(self, 'order_id'):
            return False
            
        checkout_data = {
            "order_id": self.order_id,
            "origin_url": self.base_url
        }
        
        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            "checkout/session",
            200,
            data=checkout_data
        )
        
        if success and 'session_id' in response:
            self.session_id = response['session_id']
            return True
        return False

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        # Get all orders (admin)
        success1, _ = self.run_test(
            "Admin - Get All Orders",
            "GET",
            "admin/orders",
            200
        )
        
        return success1

    def test_remove_cart_item(self):
        """Test removing item from cart"""
        if not hasattr(self, 'cart_item_id'):
            return False
            
        success, response = self.run_test(
            "Remove Cart Item",
            "DELETE",
            f"cart/{self.cart_item_id}",
            200
        )
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Coffee API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Test sequence
        tests = [
            self.test_root_endpoint,
            self.test_user_registration,
            self.test_get_user_profile,
            self.test_get_products,
            self.test_create_custom_blend,
            self.test_get_custom_blends,
            self.test_add_to_cart,
            self.test_get_cart,
            self.test_create_order,
            self.test_get_orders,
            self.test_create_subscription,
            self.test_get_subscriptions,
            self.test_get_shipping_rates,
            self.test_create_checkout_session,
            self.test_admin_endpoints,
            self.test_remove_cart_item,
        ]
        
        for test in tests:
            test()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = CoffeeAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())