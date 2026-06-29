# tests/unit/test_generate_content.py

import pytest
from unittest.mock import Mock, patch, AsyncMock
from src.use_cases.generate_content import GenerateContentUseCase
from src.domain.schemas.content_schemas import ContentPlatform, ScrapedRecipeData


@pytest.fixture
def sample_recipe_data():
    """Sample recipe data for testing"""
    return {
        "title": "Test Chocolate Chip Cookies",
        "description": "Delicious test cookies",
        "url": "https://example.com/cookies",
        "image_url": "https://example.com/cookies.jpg",
        "ingredients": [
            "2 cups flour",
            "1 cup butter",
            "1 cup chocolate chips"
        ],
        "instructions": [
            "Mix ingredients",
            "Bake at 350F",
            "Cool and serve"
        ],
        "prep_time": "15 minutes",
        "cook_time": "12 minutes",
        "servings": "24 cookies",
        "cuisine": "American",
        "category": "Dessert",
        "tags": ["cookies", "dessert"]
    }


@pytest.fixture
def use_case():
    """Create GenerateContentUseCase instance"""
    return GenerateContentUseCase()


class TestGenerateContentUseCase:
    """Unit tests for GenerateContentUseCase"""
    
    @pytest.mark.asyncio
    async def test_generate_from_recipe_data_success(self, use_case, sample_recipe_data):
        """Test successful content generation from recipe data"""
        # Mock the LLM response
        mock_llm_response = {
            "caption": "🍪 Test Chocolate Chip Cookies - The best cookies ever!",
            "hashtags": ["cookies", "baking", "dessert"],
            "platform_specific": {
                "hook": "Amazing cookies!",
                "cta": "Try this recipe!",
                "key_highlight": "Easy to make"
            },
            "image_suggestions": ["Close-up of cookies", "Cookies on plate"],
            "alternative_captions": ["Alt caption 1", "Alt caption 2"]
        }
        
        # Mock the entire chain's ainvoke method
        with patch('src.use_cases.generate_content.ChatPromptTemplate') as mock_prompt:
            mock_chain = AsyncMock()
            mock_chain.ainvoke = AsyncMock(return_value=mock_llm_response)
            
            # Setup the chain mock
            mock_prompt.from_template.return_value.__or__ = Mock(return_value=mock_chain)
            
            # Call the method
            result = await use_case.generate_from_recipe_data(
                recipe_data=sample_recipe_data,
                target_platforms=[ContentPlatform.INSTAGRAM],
                tone="engaging and friendly",
                include_emojis=True,
                max_hashtags=10
            )
            
            # Assertions
            assert result is not None
            assert "recipe" in result
            assert "generated_contents" in result
            assert len(result["generated_contents"]) == 1
            assert result["generated_contents"][0]["platform"] == ContentPlatform.INSTAGRAM
    
    @pytest.mark.asyncio
    async def test_generate_for_multiple_platforms(self, use_case, sample_recipe_data):
        """Test content generation for multiple platforms"""
        platforms = [
            ContentPlatform.INSTAGRAM,
            ContentPlatform.TWITTER,
            ContentPlatform.THREADS
        ]
        
        mock_llm_response = {
            "caption": "Test caption",
            "hashtags": ["test"],
            "platform_specific": {"hook": "Test", "cta": "Test", "key_highlight": "Test"},
            "image_suggestions": ["Test"],
            "alternative_captions": ["Test"]
        }
        
        with patch('src.use_cases.generate_content.ChatPromptTemplate') as mock_prompt:
            mock_chain = AsyncMock()
            mock_chain.ainvoke = AsyncMock(return_value=mock_llm_response)
            mock_prompt.from_template.return_value.__or__ = Mock(return_value=mock_chain)
            
            result = await use_case.generate_from_recipe_data(
                recipe_data=sample_recipe_data,
                target_platforms=platforms
            )
            
            assert len(result["generated_contents"]) == 3
            generated_platforms = [c["platform"] for c in result["generated_contents"]]
            assert ContentPlatform.INSTAGRAM in generated_platforms
            assert ContentPlatform.TWITTER in generated_platforms
            assert ContentPlatform.THREADS in generated_platforms
    
    @pytest.mark.asyncio
    async def test_generate_with_custom_tone(self, use_case, sample_recipe_data):
        """Test content generation with custom tone"""
        mock_llm_response = {
            "caption": "Professional caption",
            "hashtags": ["professional"],
            "platform_specific": {"hook": "Pro", "cta": "Learn", "key_highlight": "Expert"},
            "image_suggestions": ["Professional photo"],
            "alternative_captions": ["Alt pro caption"]
        }
        
        with patch('src.use_cases.generate_content.ChatPromptTemplate') as mock_prompt:
            mock_chain = AsyncMock()
            mock_chain.ainvoke = AsyncMock(return_value=mock_llm_response)
            # The real chain is `prompt | llm | parser`; make the parser stage
            # (mock_chain | parser) collapse back to mock_chain so ainvoke is awaited.
            mock_chain.__or__ = Mock(return_value=mock_chain)
            mock_prompt.from_template.return_value.__or__ = Mock(return_value=mock_chain)
            
            result = await use_case.generate_from_recipe_data(
                recipe_data=sample_recipe_data,
                target_platforms=[ContentPlatform.LINKEDIN],
                tone="professional and educational",
                include_emojis=False,
                max_hashtags=5
            )
            
            assert result is not None
            # Verify the mock was called
            assert mock_chain.ainvoke.called
    
    @pytest.mark.asyncio
    async def test_generate_handles_llm_failure(self, use_case, sample_recipe_data):
        """Test fallback content generation when LLM fails"""
        with patch('src.use_cases.generate_content.ChatPromptTemplate') as mock_prompt:
            mock_chain = AsyncMock()
            mock_chain.ainvoke = AsyncMock(side_effect=Exception("LLM API Error"))
            mock_prompt.from_template.return_value.__or__ = Mock(return_value=mock_chain)
            
            result = await use_case.generate_from_recipe_data(
                recipe_data=sample_recipe_data,
                target_platforms=[ContentPlatform.INSTAGRAM]
            )
            
            # Should still return result with fallback content
            assert result is not None
            assert len(result["generated_contents"]) == 1
            # Check if fallback was used (no error in result)
            content = result["generated_contents"][0]
            assert "content" in content
    
    @pytest.mark.asyncio
    async def test_generate_with_minimal_recipe_data(self, use_case):
        """Test content generation with minimal recipe data"""
        minimal_recipe = {
            "title": "Simple Recipe"
        }
        
        mock_llm_response = {
            "caption": "Simple recipe caption",
            "hashtags": ["simple"],
            "platform_specific": {"hook": "Simple", "cta": "Try", "key_highlight": "Easy"},
            "image_suggestions": ["Simple photo"],
            "alternative_captions": ["Alt simple"]
        }
        
        with patch('src.use_cases.generate_content.ChatPromptTemplate') as mock_prompt:
            mock_chain = AsyncMock()
            mock_chain.ainvoke = AsyncMock(return_value=mock_llm_response)
            mock_prompt.from_template.return_value.__or__ = Mock(return_value=mock_chain)
            
            result = await use_case.generate_from_recipe_data(
                recipe_data=minimal_recipe,
                target_platforms=[ContentPlatform.TWITTER]
            )
            
            assert result is not None
            assert result["recipe"].title == "Simple Recipe"
    
    @pytest.mark.asyncio
    async def test_generate_with_custom_instructions(self, use_case, sample_recipe_data):
        """Test content generation with custom instructions"""
        mock_llm_response = {
            "caption": "Family-friendly caption",
            "hashtags": ["family", "kids"],
            "platform_specific": {"hook": "Family", "cta": "Cook together", "key_highlight": "Kid-friendly"},
            "image_suggestions": ["Family cooking"],
            "alternative_captions": ["Alt family caption"]
        }
        
        with patch('src.use_cases.generate_content.ChatPromptTemplate') as mock_prompt:
            mock_chain = AsyncMock()
            mock_chain.ainvoke = AsyncMock(return_value=mock_llm_response)
            # The real chain is `prompt | llm | parser`; make the parser stage
            # (mock_chain | parser) collapse back to mock_chain so ainvoke is awaited.
            mock_chain.__or__ = Mock(return_value=mock_chain)
            mock_prompt.from_template.return_value.__or__ = Mock(return_value=mock_chain)
            
            result = await use_case.generate_from_recipe_data(
                recipe_data=sample_recipe_data,
                target_platforms=[ContentPlatform.FACEBOOK],
                custom_instructions="Emphasize family-friendly and kid-friendly aspects"
            )
            
            assert result is not None
            # Verify the mock was called
            assert mock_chain.ainvoke.called
    
    def test_fallback_content_generation(self, use_case, sample_recipe_data):
        """Test fallback content generation"""
        recipe = ScrapedRecipeData(**sample_recipe_data)
        
        fallback_content = use_case._generate_fallback_content(
            recipe=recipe,
            platform=ContentPlatform.INSTAGRAM,
            include_emojis=True
        )
        
        assert fallback_content is not None
        assert fallback_content.caption is not None
        assert len(fallback_content.hashtags) > 0
        assert "Test Chocolate Chip Cookies" in fallback_content.caption
    
    def test_fallback_content_without_emojis(self, use_case, sample_recipe_data):
        """Test fallback content without emojis"""
        recipe = ScrapedRecipeData(**sample_recipe_data)
        
        fallback_content = use_case._generate_fallback_content(
            recipe=recipe,
            platform=ContentPlatform.LINKEDIN,
            include_emojis=False
        )
        
        assert fallback_content is not None
        # Check that caption doesn't start with emoji
        assert not fallback_content.caption.startswith("🍽️")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
