"""
Fix status column size in wprm_content_status table
This fixes the error: "Data truncated for column 'status' at row 1"
"""

import pymysql
from src.utils.config import settings

def fix_status_column():
    """Fix the status column to be VARCHAR(50)"""
    
    print("Connecting to database...")
    print(f"Host: {settings.db_host}")
    print(f"Database: {settings.db_name}")
    print(f"User: {settings.db_user}")
    
    connection = pymysql.connect(
        host=settings.db_host,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        port=settings.db_port
    )
    
    try:
        with connection.cursor() as cursor:
            # Check current column definition
            print("\n1. Checking current status column definition...")
            cursor.execute("""
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
            """)
            result = cursor.fetchone()
            if result:
                print(f"   Current definition: {result}")
            else:
                print("   ❌ Column not found!")
                return
            
            # Modify the status column
            print("\n2. Modifying status column to VARCHAR(50)...")
            cursor.execute("""
                ALTER TABLE wprm_content_status 
                MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'not_generated'
            """)
            connection.commit()
            print("   ✅ Column modified successfully!")
            
            # Verify the change
            print("\n3. Verifying the change...")
            cursor.execute("""
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
            """)
            result = cursor.fetchone()
            print(f"   New definition: {result}")
            
            # Check if there are any existing records with truncated status
            print("\n4. Checking for any records with invalid status...")
            cursor.execute("""
                SELECT recipe_id, status, LENGTH(status) as status_length
                FROM wprm_content_status
                WHERE status NOT IN ('not_generated', 'generated', 'pending', 'posted', 'declined', 'failed')
                LIMIT 10
            """)
            invalid_records = cursor.fetchall()
            if invalid_records:
                print(f"   ⚠️  Found {len(invalid_records)} records with invalid status:")
                for record in invalid_records:
                    print(f"      Recipe ID: {record[0]}, Status: '{record[1]}', Length: {record[2]}")
            else:
                print("   ✅ All records have valid status values!")
            
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
        connection.rollback()
        raise
    finally:
        connection.close()
        print("\nDatabase connection closed.")

if __name__ == "__main__":
    print("=" * 60)
    print("WPRM Content Status Column Fix")
    print("=" * 60)
    fix_status_column()
