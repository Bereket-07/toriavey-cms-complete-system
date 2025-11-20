#!/usr/bin/env python
"""
Test Runner Script for Tori Avey CMS

Usage:
    python run_tests.py              # Run all tests
    python run_tests.py unit         # Run unit tests only
    python run_tests.py integration  # Run integration tests only
    python run_tests.py coverage     # Run with coverage report
"""

import sys
import subprocess
from pathlib import Path


def run_command(cmd):
    """Run a command and return the result"""
    print(f"\n{'='*60}")
    print(f"Running: {' '.join(cmd)}")
    print(f"{'='*60}\n")
    
    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    return result.returncode


def run_all_tests():
    """Run all tests"""
    return run_command(["pytest", "-v"])


def run_unit_tests():
    """Run unit tests only"""
    return run_command(["pytest", "tests/unit/", "-v"])


def run_integration_tests():
    """Run integration tests only"""
    return run_command(["pytest", "tests/integration/", "-v"])


def run_with_coverage():
    """Run tests with coverage report"""
    return run_command([
        "pytest",
        "--cov=src",
        "--cov-report=html",
        "--cov-report=term-missing",
        "-v"
    ])


def run_quick():
    """Run tests quickly (stop on first failure)"""
    return run_command(["pytest", "-x", "-v"])


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Running all tests...")
        return run_all_tests()
    
    command = sys.argv[1].lower()
    
    commands = {
        "all": run_all_tests,
        "unit": run_unit_tests,
        "integration": run_integration_tests,
        "coverage": run_with_coverage,
        "quick": run_quick,
        "help": lambda: print(__doc__)
    }
    
    if command in commands:
        return commands[command]()
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        return 1


if __name__ == "__main__":
    sys.exit(main())
