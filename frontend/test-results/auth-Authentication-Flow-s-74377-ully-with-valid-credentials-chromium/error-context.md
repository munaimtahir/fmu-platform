# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Welcome Back" [level=1] [ref=e6]
    - paragraph [ref=e7]: Sign in to your SIMS account
  - generic [ref=e9]:
    - alert [ref=e10]:
      - generic [ref=e11]:
        - img [ref=e13]
        - generic [ref=e15]:
          - heading "Authentication Failed" [level=3] [ref=e16]
          - generic [ref=e17]: Request failed with status code 405
    - generic [ref=e18]:
      - generic [ref=e19]: Email or Username
      - textbox "Email or Username" [ref=e20]:
        - /placeholder: your.email@example.com or username
        - text: admin
    - generic [ref=e21]:
      - generic [ref=e22]: Password
      - textbox "Password" [ref=e23]:
        - /placeholder: Enter your password
        - text: admin123
    - generic [ref=e24]:
      - generic [ref=e25]:
        - checkbox "Remember me" [ref=e26]
        - generic [ref=e27]: Remember me
      - link "Forgot password?" [ref=e29] [cursor=pointer]:
        - /url: "#"
    - button "Sign In" [ref=e30] [cursor=pointer]
    - generic [ref=e31]:
      - text: Don't have an account?
      - link "Contact your administrator" [ref=e32] [cursor=pointer]:
        - /url: "#"
  - paragraph [ref=e34]: Student Information Management System
```