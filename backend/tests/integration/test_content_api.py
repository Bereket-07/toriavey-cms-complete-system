# tests/integration/test_content_api.py

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from src.app import app


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
def sample_request_data():
    """Sample request data for testing"""
    return {
        "recipe_id": 123,
        "recipe_data": {
            "title": "Integration Test Cookies",
            "description": "Testing the API integration",
            "ingredients": [
                "2 cups flour",
                "1 cup butter",
                "1 cup chocolate chips"
            ],
            "instructions": [
                "Mix ingredients",
                "Bake at 350F for 12 minutes",
                "Cool and serve"
            ],
            "prep_time": "15 minutes",
            "cook_time": "12 minutes",
            "servings": "24 cookies",
            "cuisine": "American",
            "category": "Dessert",
            "tags": ["cookies", "dessert", "chocolate"],
            "image_url": "https://example.com/cookies.jpg",
            "url": "https://example.com/recipes/cookies"
        },
        "target_platforms": ["instagram", "twitter"],
        "tone": "engaging and friendly",
        "include_emojis": True,
        "max_hashtags": 10
    }


class TestContentGenerationAPI:
    """Integration tests for content generation API"""
    
    def test_health_endpoint(self, client):
        """Test the health check endpoint"""
        response = client.get("/api/content/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "endpoints" in data
    
    def test_root_endpoint(self, client):
        """Test the root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "endpoints" in data
        assert "content" in data["endpoints"]
    
    @patch('src.use_cases.generate_content.GenerateContentUseCase.generate_from_recipe_data')
    def test_generate_content_success(self, mock_generate, client, sample_request_data):
        """Test successful content generation via API"""
        # Mock the use case response
        mock_generate.return_value = {
            "recipe": {
                "title": "Integration Test Cookies",
                "description": "Testing the API integration"
            },
            "generated_contents": [
                {
                    "platform": "instagram",
                    "content": {
                        "caption": "🍪 Integration Test Cookies!",
                        "hashtags": ["cookies", "baking"],
                        "platform_specific": {
                            "hook": "Amazing cookies!",
                            "cta": "Try this!",
                            "key_highlight": "Easy"
                        }
                    }
                },
                {
                    "platform": "twitter",
                    "content": {
                        "caption": "🍪 Test Cookies - Quick and easy!",
                        "hashtags": ["cookies", "baking"],
                        "platform_specific": {
                            "hook": "Quick cookies!",
                            "cta": "Make today!",
                            "key_highlight": "Fast"
                        }
                    }
                }
            ]
        }
        
        response = client.post("/api/content/generate", json=sample_request_data)
        
        assert response.status_code == 202
        data = response.json()
        assert data["success"] is True
        assert "message" in data
        assert data["total_generated"] == 2
    
    def test_generate_content_missing_required_fields(self, client):
        """Test API validation for missing required fields"""
        invalid_data = {
            "recipe_data": {
                # Missing title
                "description": "Test"
            },
            "target_platforms": ["instagram"]
        }
        
        response = client.post("/api/content/generate", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    def test_generate_content_invalid_platform(self, client, sample_request_data):
        """Test API validation for invalid platform"""
        sample_request_data["target_platforms"] = ["invalid_platform"]
        
        response = client.post("/api/content/generate", json=sample_request_data)
        assert response.status_code == 422  # Validation error
    
    def test_generate_content_empty_platforms(self, client, sample_request_data):
        """Test API validation for empty platforms list"""
        sample_request_data["target_platforms"] = []
        
        response = client.post("/api/content/generate", json=sample_request_data)
        assert response.status_code == 422  # Validation error
    
    @patch('src.use_cases.generate_content.GenerateContentUseCase.generate_from_recipe_data')
    def test_generate_content_with_minimal_data(self, mock_generate, client):
        """Test content generation with minimal recipe data"""
        minimal_data = {
            "recipe_data": {
                "title": "Minimal Recipe"
            },
            "target_platforms": ["instagram"]
        }
        
        mock_generate.return_value = {
            "recipe": {"title": "Minimal Recipe"},
            "generated_contents": [
                {
                    "platform": "instagram",
                    "content": {
                        "caption": "Minimal Recipe",
                        "hashtags": ["recipe"],
                        "platform_specific": {"hook": "Test", "cta": "Try", "key_highlight": "Easy"}
                    }
                }
            ]
        }
        
        response = client.post("/api/content/generate", json=minimal_data)
        
        assert response.status_code == 202
        data = response.json()
        assert data["success"] is True
    
    def test_generate_batch_endpoint(self, client):
        """Test batch generation endpoint"""
        batch_data = {
            "recipe_ids": [1, 2, 3],
            "target_platforms": ["instagram", "twitter"],
            "batch_name": "Test Batch",
            "tone": "engaging",
            "include_emojis": True,
            "max_hashtags": 10
        }
        
        response = client.post("/api/content/generate-batch", json=batch_data)
        
        assert response.status_code == 202
        data = response.json()
        assert data["success"] is True
        assert data["total_items"] == 3
        assert "batch_id" in data
    
    def test_get_pending_content(self, client):
        """Test get pending content endpoint"""
        response = client.get("/api/content/pending")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_pending" in data
        assert "contents" in data
    
    def test_get_content_stats(self, client):
        """Test get content stats endpoint"""
        response = client.get("/api/content/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_generated" in data
        assert "pending" in data
        assert "approved" in data
        assert "rejected" in data
        assert "posted" in data
    
    def test_approve_content(self, client):
        """Test approve content endpoint"""
        approve_data = {
            "content_id": 1,
            "approved_by": 123
        }
        
        response = client.post("/api/content/approve", json=approve_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["content_id"] == 1
    
    def test_reject_content(self, client):
        """Test reject content endpoint"""
        reject_data = {
            "content_id": 1,
            "rejection_reason": "Not suitable",
            "rejected_by": 123
        }
        
        response = client.post("/api/content/reject", json=reject_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["content_id"] == 1
    
    def test_edit_content(self, client):
        """Test edit content endpoint"""
        edit_data = {
            "content_id": 1,
            "caption": "Updated caption",
            "hashtags": "#updated #test",
            "edited_by": 123
        }
        
        response = client.post("/api/content/edit", json=edit_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_bulk_approve(self, client):
        """Test bulk approve endpoint"""
        response = client.post(
            "/api/content/bulk-approve?approved_by=123",
            json=[1, 2, 3]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total"] == 3


class TestContentAPIErrorHandling:
    """Test error handling in content API"""
    
    @patch('src.use_cases.generate_content.GenerateContentUseCase.generate_from_recipe_data')
    def test_generate_content_internal_error(self, mock_generate, client, sample_request_data):
        """Test handling of internal errors"""
        mock_generate.side_effect = Exception("Internal error")
        
        response = client.post("/api/content/generate", json=sample_request_data)
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
    
    @patch('src.use_cases.generate_content.GenerateContentUseCase.generate_from_recipe_data')
    def test_generate_content_validation_error(self, mock_generate, client, sample_request_data):
        """Test handling of validation errors"""
        mock_generate.side_effect = ValueError("Invalid recipe data")
        
        response = client.post("/api/content/generate", json=sample_request_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
