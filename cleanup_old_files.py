"""
Cleanup script to remove old/unused files that don't use WPRM database
Run this script to clean up duplicate and unused files.
"""

import os
import sys

# Files to delete (old system that doesn't use WPRM)
FILES_TO_DELETE = [
    # Old scheduler files
    "src/controllers/scheduler_controller.py",
    "src/infrastructure/scheduler/daily_content_scheduler.py",
    
    # Old batch generation
    "src/use_cases/batch_generate_content.py",
    
    # Old documentation (optional - comment out if you want to keep)
    "BATCH_CONTENT_GENERATION_GUIDE.md",
    "DAILY_SCHEDULER_GUIDE.md",
    "SCHEDULER_QUICK_START.md",
    "QUICK_START_BATCH_GENERATION.md",
    "QUICK_TEST_START.md",
]

def delete_files():
    """Delete all old/unused files"""
    deleted = []
    not_found = []
    errors = []
    
    print("🗑️  Starting cleanup of old files...\n")
    
    for file_path in FILES_TO_DELETE:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted.append(file_path)
                print(f"✅ Deleted: {file_path}")
            else:
                not_found.append(file_path)
                print(f"⚠️  Not found (already deleted?): {file_path}")
        except Exception as e:
            errors.append((file_path, str(e)))
            print(f"❌ Error deleting {file_path}: {e}")
    
    # Summary
    print("\n" + "="*60)
    print("📊 CLEANUP SUMMARY")
    print("="*60)
    print(f"✅ Deleted: {len(deleted)} files")
    print(f"⚠️  Not found: {len(not_found)} files")
    print(f"❌ Errors: {len(errors)} files")
    
    if deleted:
        print("\n✅ Successfully deleted:")
        for f in deleted:
            print(f"   - {f}")
    
    if not_found:
        print("\n⚠️  Files not found (already deleted?):")
        for f in not_found:
            print(f"   - {f}")
    
    if errors:
        print("\n❌ Errors:")
        for f, err in errors:
            print(f"   - {f}: {err}")
    
    print("\n" + "="*60)
    print("✨ Cleanup complete!")
    print("="*60)
    
    return len(deleted), len(not_found), len(errors)

if __name__ == "__main__":
    print("="*60)
    print("🧹 OLD FILES CLEANUP SCRIPT")
    print("="*60)
    print("\nThis script will delete the following files:")
    for f in FILES_TO_DELETE:
        print(f"  - {f}")
    
    print("\n⚠️  WARNING: This action cannot be undone!")
    response = input("\nDo you want to proceed? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        deleted, not_found, errors = delete_files()
        
        if errors > 0:
            sys.exit(1)
        else:
            print("\n✅ All cleanup operations completed successfully!")
            sys.exit(0)
    else:
        print("\n❌ Cleanup cancelled by user.")
        sys.exit(0)
