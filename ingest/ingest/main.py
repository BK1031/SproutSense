from ingest.app import create_app
from ingest.database.db import init_db

def main():
    init_db()
    app = create_app()
    app.run(debug=True)

if __name__ == "__main__":
    main()