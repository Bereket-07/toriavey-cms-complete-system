# src/infrastructure/scrapers/recipe_scraper.py

import logging
import httpx
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup
import json
import re

from src.domain.schemas.content_schemas import ScrapedRecipeData

logger = logging.getLogger(__name__)


class RecipeScraperService:
    """
    Service to scrape recipe data from websites.
    Supports schema.org Recipe markup and common recipe site structures.
    """
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    
    async def scrape_recipe(self, url: str) -> ScrapedRecipeData:
        """
        Scrape recipe data from a URL.
        
        Args:
            url: Recipe URL to scrape
            
        Returns:
            ScrapedRecipeData with recipe information
            
        Raises:
            ValueError: If recipe data cannot be extracted
        """
        logger.info(f"Scraping recipe from: {url}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=self.headers, follow_redirects=True)
                response.raise_for_status()
                html_content = response.text
            
            # Try schema.org JSON-LD first (most reliable)
            recipe_data = self._extract_from_json_ld(html_content, url)
            
            if recipe_data:
                logger.info(f"Successfully scraped recipe: {recipe_data.title}")
                return recipe_data
            
            # Fallback to HTML parsing
            recipe_data = self._extract_from_html(html_content, url)
            
            if recipe_data:
                logger.info(f"Successfully scraped recipe from HTML: {recipe_data.title}")
                return recipe_data
            
            raise ValueError("Could not extract recipe data from the provided URL")
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error scraping {url}: {e}")
            raise ValueError(f"Failed to fetch recipe: {str(e)}")
        except Exception as e:
            logger.error(f"Error scraping recipe from {url}: {e}")
            raise ValueError(f"Failed to scrape recipe: {str(e)}")
    
    def _extract_from_json_ld(self, html: str, url: str) -> Optional[ScrapedRecipeData]:
        """Extract recipe from schema.org JSON-LD markup"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find all JSON-LD scripts
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    
                    # Handle both single object and array of objects
                    if isinstance(data, list):
                        recipes = [item for item in data if item.get('@type') == 'Recipe']
                        if recipes:
                            data = recipes[0]
                    
                    if data.get('@type') == 'Recipe':
                        return self._parse_recipe_schema(data, url)
                    
                except json.JSONDecodeError:
                    continue
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting JSON-LD: {e}")
            return None
    
    def _parse_recipe_schema(self, schema: Dict[str, Any], url: str) -> ScrapedRecipeData:
        """Parse schema.org Recipe object"""
        
        # Extract ingredients
        ingredients = []
        raw_ingredients = schema.get('recipeIngredient', [])
        if isinstance(raw_ingredients, list):
            ingredients = [str(ing) for ing in raw_ingredients]
        elif isinstance(raw_ingredients, str):
            ingredients = [raw_ingredients]
        
        # Extract instructions
        instructions = []
        raw_instructions = schema.get('recipeInstructions', [])
        
        if isinstance(raw_instructions, list):
            for item in raw_instructions:
                if isinstance(item, dict):
                    text = item.get('text', '')
                    if text:
                        instructions.append(text)
                elif isinstance(item, str):
                    instructions.append(item)
        elif isinstance(raw_instructions, str):
            instructions = [s.strip() for s in re.split(r'\n|\d+\.', raw_instructions) if s.strip()]
        
        # Extract image
        image_url = None
        image_data = schema.get('image')
        if isinstance(image_data, str):
            image_url = image_data
        elif isinstance(image_data, dict):
            image_url = image_data.get('url')
        elif isinstance(image_data, list) and len(image_data) > 0:
            if isinstance(image_data[0], str):
                image_url = image_data[0]
            elif isinstance(image_data[0], dict):
                image_url = image_data[0].get('url')
        
        # Extract times
        prep_time = self._parse_duration(schema.get('prepTime'))
        cook_time = self._parse_duration(schema.get('cookTime'))
        total_time = self._parse_duration(schema.get('totalTime'))
        
        # Extract keywords/tags
        keywords = schema.get('keywords', '')
        tags = []
        if isinstance(keywords, str):
            tags = [k.strip() for k in keywords.split(',') if k.strip()]
        elif isinstance(keywords, list):
            tags = keywords
        
        return ScrapedRecipeData(
            title=schema.get('name', 'Untitled Recipe'),
            url=url,
            description=schema.get('description'),
            cuisine=schema.get('recipeCuisine'),
            category=schema.get('recipeCategory'),
            ingredients=ingredients,
            instructions=instructions,
            prep_time=prep_time,
            cook_time=cook_time,
            total_time=total_time,
            servings=str(schema.get('recipeYield', '')),
            image_url=image_url,
            tags=tags if tags else None,
            keywords=keywords if isinstance(keywords, str) else None
        )
    
    def _extract_from_html(self, html: str, url: str) -> Optional[ScrapedRecipeData]:
        """Fallback: Extract recipe from HTML structure"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Try to find title
            title = None
            title_selectors = ['h1.recipe-title', 'h1[itemprop="name"]', 'h1.entry-title', 'h1']
            for selector in title_selectors:
                element = soup.select_one(selector)
                if element:
                    title = element.get_text(strip=True)
                    break
            
            if not title:
                return None
            
            # Try to find ingredients
            ingredients = []
            ingredient_selectors = [
                'li[itemprop="recipeIngredient"]',
                '.ingredient',
                '.recipe-ingredient',
                'ul.ingredients li'
            ]
            for selector in ingredient_selectors:
                elements = soup.select(selector)
                if elements:
                    ingredients = [el.get_text(strip=True) for el in elements]
                    break
            
            # Try to find instructions
            instructions = []
            instruction_selectors = [
                'li[itemprop="recipeInstructions"]',
                '.instruction',
                '.recipe-instruction',
                'ol.instructions li'
            ]
            for selector in instruction_selectors:
                elements = soup.select(selector)
                if elements:
                    instructions = [el.get_text(strip=True) for el in elements]
                    break
            
            # Try to find image
            image_url = None
            img_selectors = ['img[itemprop="image"]', 'img.recipe-image', 'img.wp-post-image']
            for selector in img_selectors:
                img = soup.select_one(selector)
                if img:
                    image_url = img.get('src') or img.get('data-src')
                    break
            
            if not ingredients or not instructions:
                return None
            
            return ScrapedRecipeData(
                title=title,
                url=url,
                description=None,
                cuisine=None,
                category=None,
                ingredients=ingredients,
                instructions=instructions,
                image_url=image_url
            )
            
        except Exception as e:
            logger.warning(f"Error extracting from HTML: {e}")
            return None
    
    def _parse_duration(self, duration: Optional[str]) -> Optional[str]:
        """Parse ISO 8601 duration to human-readable format"""
        if not duration:
            return None
        
        if duration.startswith('PT'):
            duration = duration[2:]
            hours = 0
            minutes = 0
            
            if 'H' in duration:
                hours_str, duration = duration.split('H')
                hours = int(hours_str)
            
            if 'M' in duration:
                minutes_str = duration.split('M')[0]
                minutes = int(minutes_str)
            
            parts = []
            if hours:
                parts.append(f"{hours} hour{'s' if hours > 1 else ''}")
            if minutes:
                parts.append(f"{minutes} minute{'s' if minutes > 1 else ''}")
            
            return ' '.join(parts) if parts else None
        
        return duration
