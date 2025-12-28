
    ## Students
    - `GET /api/students` (Admin/Registrar; Student sees own only)
      - Query: `search=<text>` across `reg_no,name,program,status`
      - Pagination: `?page=1` (default size 10)
    - `POST /api/students` (Admin/Registrar)
    - `GET /api/students/{id}` (Admin/Registrar; Student if own record)
    - `PATCH /api/students/{id}` (Admin/Registrar)
    - `DELETE /api/students/{id}` (Admin/Registrar)

    **Error shape**
    ```json
    {"error":{"code":400,"message":"Bad Request","details":{"reg_no":["This field is required."]}}}
    ```
    
