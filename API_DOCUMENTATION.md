# Parking Lot Service API Documentation

The Parking Lot Service manages car parking and unparking operations across multiple lots. It includes Attendant logic to direct cars based on different strategies and maintains a complete history of all parking events.

## Base URL
`http://localhost:3000/api/parking-lot`

## Endpoints

### 1. Park a Car (Attendant Mode)
Used to park a car. The service acts as an attendant and directs the car to a lot based on the specified strategy.

*   **URL:** `/park`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "registrationNumber": "KA-01-HH-1234",
      "strategy": "FIRST_AVAILABLE" 
    }
    ```
    *   **Strategies:** 
        *   `FIRST_AVAILABLE` (Default): Parks in the first lot that has space.
        *   `LEAST_AVAILABLE`: Parks in the lot that is most full (to compact cars).
        *   `MOST_AVAILABLE`: Parks in the lot with the most free space (to distribute load).

*   **CURL Example:**
    ```bash
    curl -X POST http://localhost:3000/api/parking-lot/park \
      -H "Content-Type: application/json" \
      -d '{"registrationNumber": "KA-01-HH-1234", "strategy": "LEAST_AVAILABLE"}'
    ```

### 2. Unpark a Car
Removes a car from whichever lot it is currently parked in.

*   **URL:** `/unpark/:registrationNumber`
*   **Method:** `DELETE`
*   **Auth Required:** Yes
*   **CURL Example:**
    ```bash
    curl -X DELETE http://localhost:3000/api/parking-lot/unpark/KA-01-HH-1234
    ```

### 3. Get Status
Get the current state of all managed parking lots.

*   **URL:** `/status`
*   **Method:** `GET`
*   **CURL Example:**
    ```bash
    curl -X GET http://localhost:3000/api/parking-lot/status
    ```

### 4. Get Parking History
Retrieves a complete log of all park and unpark actions with timestamps.

*   **URL:** `/history`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `registrationNumber` (optional): Filter history for a specific car.
*   **CURL Example:**
    ```bash
    # View all history
    curl -X GET http://localhost:3000/api/parking-lot/history
    
    # Filter by car
    curl -X GET http://localhost:3000/api/parking-lot/history?registrationNumber=KA-01-HH-1234
    ```
*   **Success Response:**
    ```json
    {
      "success": true,
      "count": 2,
      "data": [
        {
          "registrationNumber": "KA-01-HH-1234",
          "lotId": "LOT-1",
          "action": "UNPARK",
          "timestamp": "2026-01-05T13:38:00.000Z"
        },
        {
          "registrationNumber": "KA-01-HH-1234",
          "lotId": "LOT-1",
          "action": "PARK",
          "timestamp": "2026-01-05T13:35:00.000Z"
        }
      ]
    }
    ```

## Core Business Logic Requirements
1.  **Multiple Lots**: The attendant manages a collection of parking lots.
2.  **Parking Strategies**: Sequential, Packing (Least Available), or Distributed (Most Available).
3.  **Cross-Lot Validation**: Prevents the same car from being parked in multiple lots simultaneously.
4.  **Transaction Logging**: Every park and unpark action is recorded with an immutable timestamp.
5.  **Notifications**: Owners are notified when lots become full or available.
