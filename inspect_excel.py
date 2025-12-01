import pandas as pd

file_path = '스타 세이비어 아르카나 V1.0_251125의 사본.xlsx'

try:
    # Load the Excel file to list sheet names
    xls = pd.ExcelFile(file_path)
    print(f"Sheet names: {xls.sheet_names}")

    # Read the 'DB' sheet if it exists, otherwise read the first sheet
    if 'DB' in xls.sheet_names:
        df = pd.read_excel(file_path, sheet_name='DB')
        print("\nColumns in 'DB' sheet:")
        print(df.columns.tolist())
        print("\nFirst 3 rows:")
        print(df.head(3))
    else:
        print("\n'DB' sheet not found.")
except Exception as e:
    print(f"Error: {e}")
