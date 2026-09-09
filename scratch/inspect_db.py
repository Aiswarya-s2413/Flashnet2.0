import psycopg2

def inspect_and_fix():
    conn = psycopg2.connect(
        dbname='postgres',
        user='postgres',
        password='postgres',
        host='127.0.0.1',
        port='5432'
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    # Let's check existing constraints on onboarding_onboardingrequest
    cur.execute("""
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'onboarding_onboardingrequest'::regclass;
    """)
    print("Constraints on onboarding_onboardingrequest:")
    for row in cur.fetchall():
        print(row)
        
    # Let's check existing constraints on users_notificationemail
    cur.execute("""
        SELECT conname, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'users_notificationemail'::regclass;
    """)
    print("\nConstraints on users_notificationemail:")
    for row in cur.fetchall():
        print(row)

    # Let's fix onboarding_onboardingrequest constraint if it points to auth_user
    try:
        cur.execute("ALTER TABLE onboarding_onboardingrequest DROP CONSTRAINT IF EXISTS onboarding_onboardingrequest_user_id_7a02fd4e_fk_auth_user_id;")
        print("\nDropped old constraint from onboarding_onboardingrequest.")
    except Exception as e:
        print(f"Error dropping constraint: {e}")
        
    try:
        cur.execute("ALTER TABLE onboarding_onboardingrequest ADD CONSTRAINT onboarding_onboardingrequest_user_id_fk_users_distributoruser FOREIGN KEY (user_id) REFERENCES users_distributoruser(id) DEFERRABLE INITIALLY DEFERRED;")
        print("Added new correct constraint to onboarding_onboardingrequest.")
    except Exception as e:
        print(f"Error adding constraint: {e}")
        
    # Let's fix users_notificationemail constraint if it points to auth_user
    try:
        cur.execute("ALTER TABLE users_notificationemail DROP CONSTRAINT IF EXISTS users_notificationemail_user_id_281545d2_fk_auth_user_id;")
        print("\nDropped old constraint from users_notificationemail.")
    except Exception as e:
        print(f"Error dropping constraint: {e}")
        
    try:
        cur.execute("ALTER TABLE users_notificationemail ADD CONSTRAINT users_notificationemail_user_id_fk_users_distributoruser FOREIGN KEY (user_id) REFERENCES users_distributoruser(id) DEFERRABLE INITIALLY DEFERRED;")
        print("Added new correct constraint to users_notificationemail.")
    except Exception as e:
        print(f"Error adding constraint: {e}")
        
    conn.close()

if __name__ == '__main__':
    inspect_and_fix()
