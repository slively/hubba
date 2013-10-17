hubba
=====

Hubba is a lightweight service bus built for front end developers to easily create a restful service bus that auto-generates a .js file for interaction, and documentation for other developers. Initial adapters for resources include mysql, postgresql, rest proxy, soap web services, static files, emails, and a custom adapter (controller) allowing for writing javascript on the server.

Current Desired Design
-----
- **api.domain.com/v*** -> All API requests will go through here with version (v1, v2, etc...).
- **api.domain.com/js** -> All static .js files generated by the API config will be pulled here. Files will be minified and can include added uploaded libraries.
- **api.domain.com/docs** -> Auto-generated documentation for each API endpoint with a testing tool.
- **admin.domain.com** -> Admin console for configuration & development.
- **domain.com** -> Static files hosted from here.

General Philosophy
-----
- Javascript is great
- Front-end developers are great
- Rest-ful API's are great
- Lightweight middleware is great
- Client side generated HTML is great
- Plain ol' SQL is great
- Auto-documentation is great
- Auto-generated javascript to interact with the api is great
- AngularJS is great, so are other frameworks and those should get their own plugins
- Built-in testing is great
- Built-in logging is great
- Simple deployment is great
- Serving static files is great
- Multiple ways to handle authentication is great
- Web development is great
- ORM frameworks can be great, but most likely won't be included
- Server side html can be great, but is left out
- Java,PHP,Python, etc... are all great, but don't have much place here
- MVC is great, but the goal with Hubba is to keep everything service oriented


Requirements
-----
Nodejs + Nginx

Notes
-----
This is still early in implementation, right now you can build out your resource tree, and REST and SOAP proxies are working. Current implementation isn't matching the desired design below and will be changing quite a bit.
