# Parking Lot Service API Documentation

The Parking Lot Service manages car parking and unparking operations, tracks capacity, and notifies the owner about status changes (Full/Available).

## Base URL
`http://localhost:3002/api/parking-lot`

## Endpoints

### 1. Park a Car
Used to park a car in the lot. It will reduce the available capacity.

*   **URL:** `/park`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body:**
    ```json
    {
      "registrationNumber": "KA-01-HH-1234"
    }
    ```
*   **CURL Example:**
    ```bash
    curl -X POST http://localhost:3002/api/parking-lot/park \
      -H "Content-Type: application/json" \
      -d '{"registrationNumber": "KA-01-HH-1234"}'
    ```
*   **Success Response:**
    *   **Code:** 201
    *   **Content:**
        ```json
        {
          "success": true,
          "data": {
            "registrationNumber": "KA-01-HH-1234"
          },
          "availableCapacity": 9
        }
        ```
*   **Error Response:**
    *   **Code:** 400 (Bad Request)
    *   **Content:** `{ "success": false, "message": "Parking lot is full" }`
    *   **Content:** `{ "success": false, "message": "Car already parked" }`

### 2. Unpark a Car
Used to remove a car from the lot. It will increase the available capacity. If the lot was full, the owner will be notified that it is now available.

*   **URL:** `/unpark/:registrationNumber`
*   **Method:** `DELETE`
*   **Auth Required:** Yes
*   **Path Parameters:**
    *   `registrationNumber` (string): The registration number of the car to unpark.
*   **CURL Example:**
    ```bash
    curl -X DELETE http://localhost:3002/api/parking-lot/unpark/KA-01-HH-1234
    ```
*   **Success Response:**
    *   **Code:** 200
    *   **Content:**
        ```json
        {
          "success": true,
          "data": {
            "registrationNumber": "KA-01-HH-1234"
          },
          "availableCapacity": 10
        }
        ```
*   **Error Response:**
    *   **Code:** 404 (Not Found)
    *   **Content:** `{ "success": false, "message": "Car not found" }`

### 3. Get Status
Get the current state of the parking lot, including capacity and number of parked cars.

*   **URL:** `/status`
*   **Method:** `GET`
*   **Auth Required:** Yes
*   **CURL Example:**
    ```bash
    curl -X GET http://localhost:3002/api/parking-lot/status
    ```
*   **Success Response:**
    *   **Code:** 200
    *   **Content:**
        ```json
        {
          "success": true,
          "capacity": 10,
          "availableCapacity": 5,
          "isFull": false,
          "parkedCarsCount": 5
        }
        ```

## Core Business Logic Requirements
The API implements the following logic:
1.  **Capacity Tracking**: Available capacity reduces when a car is parked and increases when unparked.
2.  **Notification System**:
    *   **Full Notification**: Triggered immediately when the last available spot is filled.
    *   **Available Notification**: Triggered when a car is unparked from a lot that was previously at 100% capacity.
3.  **Validation**: Prevents unparking of cars not present in the lot and prevents parking in a full lot.
