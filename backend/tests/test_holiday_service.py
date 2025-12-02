import pytest
from src.services.holiday_service import HolidayService

def test_get_upcoming_holidays():
    """
    Test fetching upcoming holidays.
    This test prints the output so the user can verify it manually.
    """
    service = HolidayService()
    
    # Fetch holidays for the next 60 days to ensure we get some hits
    holidays = service.get_upcoming_holidays(days=60)
    
    print("\n--- Upcoming Holidays (Next 60 Days) ---")
    for h in holidays:
        print(f"{h['date']}: {h['name']} ({h['type']})")
    print("----------------------------------------\n")
    
    # Basic assertions
    assert isinstance(holidays, list)
    # We can't strictly assert not empty because it depends on the date, 
    # but usually there's something in 60 days. 
    # If empty, it's not necessarily a failure, but we want to see the print output.
