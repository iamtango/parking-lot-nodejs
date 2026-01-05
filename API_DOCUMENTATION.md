# Parking Lot Service API Documentation

The Parking Lot Service manages car parking and unparking operations across multiple lots. It supports hierarchical management through **Coordinators** and **Attendants** to optimize traffic flow and resource utilization.

## Base URL
`http://localhost:3000/api/parking-lot`

## Endpoints

### 1. Park a Car
Used to park a car. The request can be directed through different management layers.

*   **URL:** `/park`
*   **Method:** `POST`
*   **Auth Required:** Yes
*   **Request Body Options:**

#### Option A: Coordinator Mode (Highest Level)
Directs the car to an available attendant managed by the coordinator.
```json
{
  "registrationNumber": "CAR-123",
  "coordinatorId": "COORD-1",
  "strategy": "FIRST_AVAILABLE"
}
```

#### Option B: Attendant Mode
Directs the car to a lot specifically managed by this attendant.
```json
{
  "registrationNumber": "CAR-123",
  "attendantId": "ATT-1",
  "strategy": "LEAST_AVAILABLE"
}
```

#### Option C: Default Mode
Directs the car to any available lot in the system.
```json
{
  "registrationNumber": "CAR-123",
  "strategy": "MOST_AVAILABLE"
}
```

*   **Strategies:** 
    *   `FIRST_AVAILABLE` (Default): Parks in the first lot that has space.
    *   `LEAST_AVAILABLE`: Parks in the lot that is most full (to compact cars).
    *   `MOST_AVAILABLE`: Parks in the lot with the most free space (to distribute load).

*   **CURL Example (Coordinator):**
    ```bash
    curl -X POST http://localhost:3000/api/parking-lot/park \
      -H "Content-Type: application/json" \
      -d '{"registrationNumber": "KA-01-HH-1234", "coordinatorId": "COORD-1", "strategy": "FIRST_AVAILABLE"}'
    ```

### 2. Unpark a Car
Removes a car from whichever lot it is currently parked in.

*   **URL:** `/unpark/:registrationNumber`
*   **Method:** `DELETE`
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
Retrieves a complete log of all actions with timestamps (`createdAt`).

*   **URL:** `/history`
*   **Method:** `GET`
*   **CURL Example:**
    ```bash
    curl -X GET http://localhost:3000/api/parking-lot/history
    ```

## Hierarchical Management Rules
1.  **Coordinators**: Manage a group of attendants. They direct incoming cars to the first attendant who has space in any of their managed lots.
2.  **Attendants**: Manage a group of parking lots. They use specific strategies (First, Least, or Most Available) to pick a lot.
3.  **Cross-Lot Validation**: A unique vehicle can only be parked in one lot at a time across the entire system.
4.  **Audit Trail**: Every movement is recorded in the `ParkingHistory` collection.
