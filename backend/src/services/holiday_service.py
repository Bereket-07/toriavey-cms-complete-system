import logging
import requests
from datetime import datetime, timedelta
import holidays
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class HolidayService:
    """
    Service to fetch upcoming holidays (US and Jewish).
    """

    def __init__(self):
        self.us_holidays = holidays.US()

    def get_upcoming_holidays(self, days: int = 45) -> List[Dict[str, Any]]:
        """
        Get a list of upcoming holidays for the next `days` days.
        Includes US Federal holidays and major Jewish holidays.
        """
        upcoming = []
        today = datetime.now().date()
        end_date = today + timedelta(days=days)

        # 1. Fetch US Holidays
        for date, name in self.us_holidays.items():
            if today <= date <= end_date:
                upcoming.append({
                    "name": name,
                    "date": date.strftime("%Y-%m-%d"),
                    "type": "US Holiday"
                })

        # 2. Fetch Jewish Holidays (Hebcal API)
        try:
            # Fetch for current year and next year to cover year boundaries
            current_year = today.year
            next_year = current_year + 1
            
            # Hebcal API params: v=1, cfg=json, maj=on (major), min=on (minor), mod=on (modern), year=now
            url = f"https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&year={current_year}&yt=G"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                self._process_hebcal_items(data.get('items', []), upcoming, today, end_date)
            
            # If end_date spills into next year, fetch next year too
            if end_date.year > current_year:
                 url_next = f"https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&year={next_year}&yt=G"
                 response_next = requests.get(url_next)
                 if response_next.status_code == 200:
                    data_next = response_next.json()
                    self._process_hebcal_items(data_next.get('items', []), upcoming, today, end_date)

        except Exception as e:
            logger.error(f"Failed to fetch Jewish holidays: {e}")

        # Sort by date
        upcoming.sort(key=lambda x: x['date'])
        
        return upcoming

    def _process_hebcal_items(self, items: List[Dict], upcoming: List[Dict], start_date, end_date):
        """Helper to process Hebcal items and add to list if within range"""
        for item in items:
            try:
                # Hebcal dates are YYYY-MM-DD
                h_date_str = item.get('date')
                if not h_date_str:
                    continue
                    
                h_date = datetime.strptime(h_date_str, "%Y-%m-%d").date()
                
                if start_date <= h_date <= end_date:
                    # Avoid duplicates if multiple entries (e.g. candle lighting vs holiday start)
                    # Hebcal categories: 'holiday', 'candles', 'parashat'
                    category = item.get('category')
                    if category == 'holiday':
                        upcoming.append({
                            "name": item.get('title'),
                            "date": h_date_str,
                            "type": "Jewish Holiday"
                        })
            except ValueError:
                continue
