#!/usr/bin/env python3
"""
Quick performance diagnostic tool for Tori Avey CMS
Run this to identify slow API endpoints
"""

import requests
import time
from colorama import init, Fore, Style

# Initialize colorama for colored output
init(autoreset=True)

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, url, threshold_ms=500):
    """Test an endpoint and report timing"""
    try:
        start = time.time()
        response = requests.get(url, timeout=10)
        duration_ms = (time.time() - start) * 1000
        
        if response.status_code == 200:
            if duration_ms < threshold_ms:
                status = f"{Fore.GREEN}✓ FAST"
            elif duration_ms < threshold_ms * 2:
                status = f"{Fore.YELLOW}⚠ OK"
            else:
                status = f"{Fore.RED}✗ SLOW"
            
            print(f"{status} | {name:30} | {duration_ms:6.0f}ms | Status: {response.status_code}{Style.RESET_ALL}")
            return duration_ms
        else:
            print(f"{Fore.RED}✗ ERROR | {name:30} | Status: {response.status_code}{Style.RESET_ALL}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}✗ FAILED | {name:30} | Error: {str(e)[:40]}{Style.RESET_ALL}")
        return None

def main():
    print(f"\n{Fore.CYAN}{'='*80}")
    print(f"  Tori Avey CMS - Performance Diagnostic Tool")
    print(f"{'='*80}{Style.RESET_ALL}\n")
    
    print(f"{Fore.WHITE}Testing backend: {BASE_URL}{Style.RESET_ALL}\n")
    
    # Test endpoints
    tests = [
        ("Health Check", f"{BASE_URL}/health", 100),
        ("Root Endpoint", f"{BASE_URL}/", 100),
        ("Scheduler Status", f"{BASE_URL}/api/wprm-scheduler/status", 200),
        ("WPRM Status Summary", f"{BASE_URL}/api/content/wprm-status-summary", 500),
        ("WPRM Recipes (10)", f"{BASE_URL}/api/content/wprm-recipes?limit=10", 500),
        ("WPRM Recipes (20)", f"{BASE_URL}/api/content/wprm-recipes?limit=20", 800),
        ("WPRM Recipes Count", f"{BASE_URL}/api/content/wprm-recipes-count", 300),
        ("Not Generated Recipes", f"{BASE_URL}/api/content/wprm-recipes-not-generated?limit=10", 500),
        ("Generated Not Posted", f"{BASE_URL}/api/content/wprm-recipes-generated-not-posted?limit=10", 500),
        ("Pending Recipes", f"{BASE_URL}/api/content/wprm-recipes-pending?limit=10", 500),
    ]
    
    results = []
    print(f"{Fore.WHITE}{'Status':6} | {'Endpoint':30} | {'Time':>6} | {'HTTP Status'}{Style.RESET_ALL}")
    print(f"{'-'*70}")
    
    for name, url, threshold in tests:
        duration = test_endpoint(name, url, threshold)
        if duration is not None:
            results.append((name, duration))
    
    # Summary
    print(f"\n{Fore.CYAN}{'='*80}{Style.RESET_ALL}")
    print(f"{Fore.WHITE}SUMMARY:{Style.RESET_ALL}\n")
    
    if results:
        avg_time = sum(d for _, d in results) / len(results)
        slowest = max(results, key=lambda x: x[1])
        fastest = min(results, key=lambda x: x[1])
        
        print(f"  Total Tests: {len(results)}")
        print(f"  Average Time: {avg_time:.0f}ms")
        print(f"  Fastest: {fastest[0]} ({fastest[1]:.0f}ms)")
        print(f"  Slowest: {slowest[0]} ({slowest[1]:.0f}ms)")
        
        # Recommendations
        print(f"\n{Fore.YELLOW}RECOMMENDATIONS:{Style.RESET_ALL}\n")
        
        slow_endpoints = [name for name, duration in results if duration > 1000]
        if slow_endpoints:
            print(f"{Fore.RED}  ⚠ Slow endpoints detected:{Style.RESET_ALL}")
            for endpoint in slow_endpoints:
                print(f"    - {endpoint}")
            print(f"\n  {Fore.WHITE}Suggested fixes:{Style.RESET_ALL}")
            print(f"    1. Add database indexes (see QUICK_FIX_SLOW_LOADING.md)")
            print(f"    2. Implement caching for expensive queries")
            print(f"    3. Add database connection pooling")
        else:
            print(f"{Fore.GREEN}  ✓ All endpoints performing well!{Style.RESET_ALL}")
        
        if avg_time > 500:
            print(f"\n  {Fore.YELLOW}Overall performance could be improved:{Style.RESET_ALL}")
            print(f"    - Consider adding Redis caching")
            print(f"    - Optimize database queries")
            print(f"    - Check database server performance")
    
    print(f"\n{Fore.CYAN}{'='*80}{Style.RESET_ALL}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Test interrupted by user{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}Error: {e}{Style.RESET_ALL}")
