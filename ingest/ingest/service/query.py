import pandas as pd
from ingest.database.db import get_db
import numpy as np

def query_sensors(smid: int, sensors: list[str], start: str = None, end: str = None) -> list[pd.DataFrame]:
    """
    Retrieves sensor data within a specified time range.
    
    Parameters:
    -----------
    smid : int
        The smid of the sensor to query.
    sensors : list or str
        The sensor(s) to query. Can be a single sensor name (str) or a list of sensor names.
    start : datetime or str, optional
        The start time of the query range. If str, should be in a standard datetime format.
    end : datetime or str, optional
        The end time of the query range. If str, should be in a standard datetime format.
        
    Returns:
    --------
    list[pd.DataFrame]
        A list of pandas dataframes each with two columns: created_at, {sensor}.
    """
    sensors_str = "('" + "', '".join(sensors) + "')"
    query = f"""
    SELECT "created_at", "name", "value" 
    FROM "sensor"
    WHERE "name" IN {sensors_str}
    AND "smid" = {smid}"""

    if start:
        query += f"\nAND created_at > '{start}'"
    if end:
        query += f"\nAND created_at < '{end}'"

    query += "\nORDER BY created_at ASC;"
        
    db = get_db()
    result = pd.read_sql(query, db.bind)
    return [
        result[result['name'] == sensor][['created_at', 'value']]
        .rename(columns={'value': sensor})
        .reset_index(drop=True)
        for sensor in sensors
    ]

def query_latest_sensors(smid: int, sensors: list[str]) -> pd.DataFrame:
    """
    Retrieves the latest sensor data for a given smid and sensors.
    
    Parameters: 
    -----------
    smid : int
        The smid of the sensor to query.
    sensors : list or str
        The sensor(s) to query. Can be a single sensor name (str) or a list of sensor names.
        
    Returns:
    --------
    pd.DataFrame
        - DataFrame with the latest sensor data
    """
    sensors_str = "('" + "', '".join(sensors) + "')"
    query = f"""
    SELECT DISTINCT ON ("name") "created_at", "name", "value"
    FROM "sensor"
    WHERE "name" IN {sensors_str}
    AND "smid" = {smid}
    ORDER BY "name", "created_at" DESC"""

    db = get_db()
    result = pd.read_sql(query, db.bind)
    return result



def fill_nan(df: pd.DataFrame, method: str = 'ffill') -> pd.DataFrame:
    """
    Fills NaN values in a DataFrame using the specified method.
    
    Parameters:
    -----------
    df : pd.DataFrame
        The DataFrame to fill
    method : str, optional
        The method to use to fill the DataFrame. Default is 'ffill'.
        Can be 'ffill', 'bfill', 'linear', 'time'
        
    Returns:
    --------
    pd.DataFrame
        - DataFrame with NaNs filled
    """
    df = df.sort_values(by='created_at')
    df = df.reset_index(drop=True)

    if method == 'ffill':
        df = df.ffill()
    elif method == 'bfill':
        df = df.bfill()
    elif method == 'linear':
        df = df.interpolate(method='linear')
    elif method == 'time':
        df = df.interpolate(method='time')
    else:
        raise ValueError("Invalid fill method")

    return df

def merge_to_smallest(*dfs: pd.DataFrame) -> pd.DataFrame:
    """
    Merges multiple DataFrames to the smallest one using asof merge.
    
    Parameters:
    -----------
    *dfs : pd.DataFrame
        Variable number of DataFrames, each with 'created_at' and one signal column
        
    Returns:
    --------
    pd.DataFrame
        - DataFrame with merged signals aligned to shortest timeline
    """
    if not dfs:
        raise ValueError("At least one DataFrame must be provided")
    
    smallest = min(dfs, key=len)
    merged = smallest.copy()

    tolerance = pd.Timedelta(seconds=10)

    for df in dfs:
        if df.equals(smallest):
            continue
        merged = pd.merge_asof(merged, df, on='created_at', tolerance=tolerance)

    merged = merged.sort_values(by='created_at')
    merged = merged.reset_index(drop=True)

    return merged

def merge_to_largest(*dfs: pd.DataFrame, fill: str = 'ffill') -> pd.DataFrame:
    """
    Merges multiple DataFrames to the largest one using asof merge.
    
    Parameters:
    -----------
    *dfs : pd.DataFrame 
        Variable number of DataFrames, each with 'created_at' and one signal column
    fill : str, optional
        The fill method to use. Default is 'ffill'.
        Can be 'ffill', 'bfill', 'linear', 'time'
        
    Returns:
    --------
    pd.DataFrame
        - DataFrame with merged signals aligned to largest timeline
    """
    if not dfs:
        raise ValueError("At least one DataFrame must be provided")
    if fill not in ['ffill', 'bfill', 'linear', 'time']:
        raise ValueError("Invalid fill method")
    
    print(f"Merging {len(dfs)} DataFrames: {', '.join([df.columns[1] for df in dfs])}")
    
    largest = max(dfs, key=len)
    merged = largest.copy()

    # Increased tolerance to 30 seconds
    tolerance = pd.Timedelta(seconds=10)

    for df in dfs:
        if df.equals(largest):
            continue
        merged = pd.merge_asof(
            merged, 
            df, 
            on='created_at', 
            tolerance=tolerance,
            direction='nearest'
        )

    # Print prefill NaN statistics
    nan_stats = merged.isna().sum()
    print("\nPrefill NaN Statistics:")
    for col, count in nan_stats.items():
        print(f"{col}: {count} NaNs ({count/len(merged)*100:.2f}%)")

    merged = fill_nan(merged, fill)
    merged = merged.sort_values(by='created_at')
    merged = merged.reset_index(drop=True)

    # Round created_at to nearest second
    merged['created_at'] = merged['created_at'].dt.round('s')
    
    return merged