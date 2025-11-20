"""
Fix status column using SQLAlchemy
Simple alternative that uses existing database connection
"""

from sqlalchemy import text
from src.infrastructure.repository.db_config import engine

def fix_status_column():
    """Fix the status column to be VARCHAR(50)"""
    
    print("=" * 60)
    print("WPRM Content Status Column Fix (SQLAlchemy)")
    print("=" * 60)
    
    try:
        with engine.connect() as connection:
            # Check current column definition
            print("\n1. Checking current status column definition...")
            result = connection.execute(text("""
                SELECT 
                    COLUMN_NAME,
                    COLUMN_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    IS_NULLABLE,
                    COLUMN_DEFAULT
                FROM 
                    INFORMATION_SCHEMA.COLUMNS
                WHERE 
                    TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'wprm_content_status'
                    AND COLUMN_NAME = 'status'
            """))
            row = result.fetchone()
            if row:
                print(f"   Current: {row[1]} (max length: {row[2]})")
            else:
                print("   ❌ Column not found!")
                return
            
            # Modify the status column
            print("\n2. Modifying status column to VARCHAR(50)...")
            connection.execute(text("""
                ALTER TABLE wprm_content_status 
                MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'not_generated'
            """))
            connection.commit()
            print("   ✅ Column modified successfully!")
            
            # Verify the change
            print("\n3. Verifying the change...")
            result = connection.execute(text("""
                SELECT 
                    COLUMN_NAME,
                    COLUMN_TYPE,
                    CHARACTER_MAXIMUM_LENGTH
                FROM 
                    INFORMATION_SCHEMA.COLUMNS
                WHERE 
                    TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'wprm_content_status'
                    AND COLUMN_NAME = 'status'
            """))
            row = result.fetchone()
            print(f"   New: {row[1]} (max length: {row[2]})")
            
            # Check status distribution
            print("\n4. Checking status distribution...")
            result = connection.execute(text("""
                SELECT status, COUNT(*) as count
                FROM wprm_content_status
                GROUP BY status
            """))
            rows = result.fetchall()
            if rows:
                print("   Status distribution:")
                for row in rows:
                    print(f"      {row[0]}: {row[1]} records")
            else:
                print("   No records found in table")
            
            print("\n✅ Status column fix completed successfully!")
            print("\nValid status values:")
            print("   - 'not_generated' (13 chars)")
            print("   - 'generated' (9 chars)")
            print("   - 'pending' (7 chars)")
            print("   - 'posted' (6 chars)")
            print("   - 'declined' (8 chars)")
            print("   - 'failed' (6 chars)")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    fix_status_column()
