# Data Governance

    ## Retention
    - Student records: permanent
    - Attendance: 7 years
    - Assessment artifacts: 5 years
    - Logs/audits: 7 years

    ## Privacy
    - Minimize PII; store only necessary fields.
    - Redact PII in logs; never log secrets.
    - Follow local university/HEC guidance.

    ## Audit
    - Every write stores actor, timestamp, change summary.
    - Sensitive fields (grades after publish) require dual approval.
