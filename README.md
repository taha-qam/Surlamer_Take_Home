# Surlamer — Equity Research Workbench

A two-page equity research web application built with React + TypeScript. Browse US equities with live market data, dig into company details, and manage a persistent research portfolio.

## Getting Started

Make sure you are on the latest version of Node.js (v18.20.4 was used for this project)

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Stack

Framework: React + Typescript (Required)
Routing: Standard SPA routing for simplicity, specifically used React Router since we are working in React
Data: Massive REST API (Required)
General Layout: Seperated into hooks, components, pages to avoid code smell with large, 500+ line files. Easier to break down and understand
UI: CSS in JS style objects since it is what I have used before, avoids dealing with conflict with a component library. Looked at Surlamer Investments website and tried to make sure that the UI fit the color scheme and general look of that website. 


## Things to do in future
### 1. **Backend Separation**: Implement a backend service (e.g., using Express, SpringBoot, anything else) to handle API requests. This allows for better control over data management as well as security (since using something like JWT tokens to store API keys will help keep sensitive information in backend). I still stored them in a .env file, but could have done more for security. 

### 2. **Testing**
  - **Unit and Integration Tests**: Working through this quickly, not in an Agile setting, I wasn't able to implement unit tests for components and integration tests for API interactions, say, by using testing libraries like Jest and React Testing Library. However, I still went through the website and checked to make sure different features work well in tandem, and that there is no major issues. 
  - **End-to-End Testing**: Use tools like Cypress or Playwright for end-to-end testing to ensure the entire application works as expected.

### 3. **Accessibility**: I used semantic HTML, making sure it would be easier to read/understand for people hard of hearing, etc. However, I went off of the Surlamer Investments website to get the colors, and the shades of different blue could make it harder to understand for someone with poor eyesight. Furthermore, I could have added shortcuts and different options for keybaord navigability (for example, selecting articles to read, switching to workbench, etc)

### 4. **Documentation**: Of course, since it was done quickly in four hours, I wasn't able to make sure there was proper documentation 

### 5. **Stock History**: I had the past 90 days showing for a stock, as well as recent news about it and other detailed information, but I didn't set anything up to see beyond a stock's 90 day performance (for example, performance for the year, past 5 years, etc) since I was busy figuring out frontend

### 6. **Portfolio History**: The portfolio could have shown more than the day's gains/losses. For example, one should be able to see their losses/gains in the last 90 days, etc. With more time to code and read Massive Docs, I'd be able to easily implement it, but my main priority was making sure the code that I do have is clean, rather than bloating a project full of code smells with features
