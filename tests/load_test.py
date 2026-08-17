from locust import HttpUser, task, between
import random
import string

class SmartRetailUser(HttpUser):
    # Simulates a user waiting 1 to 3 seconds between actions
    wait_time = between(1, 3)
    token = None

    def on_start(self):
        """
        Runs once per simulated user before the tasks start.
        Registers a random test user and logs in to get a JWT token.
        """
        email = f"loadtest_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}@test.com"
        password = "Password123!"
        
        # Register User
        self.client.post("/api/v1/auth/register", json={
            "email": email,
            "password": password,
            "firstName": "Load",
            "lastName": "Tester"
        }, name="Register User")

        # Login User
        response = self.client.post("/api/v1/auth/login", json={
            "email": email,
            "password": password
        }, name="Login User")
        
        if response.status_code == 200:
            self.token = response.json().get("token")

    @task(3)
    def view_products(self):
        """
        Hits the product service which is typically the heaviest 
        read endpoint for a retail application. Requires authentication.
        """
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        
        with self.client.get("/api/v1/products", headers=headers, name="View Products", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed! Status code: {response.status_code}")

    @task(1)
    def view_health_status(self):
        """
        Hits the health check to ensure API Gateway and Load Balancer are responsive.
        """
        with self.client.get("/api/v1/health", name="Health Check", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed! Status code: {response.status_code}")
