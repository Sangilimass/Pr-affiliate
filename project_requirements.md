# Deal Galaxy - Amazon.in Affiliate Deals Web Application

## Project Overview

Deal Galaxy is a production-ready Amazon.in affiliate-deals web application designed to provide users with live deal tracking, price monitoring, and affiliate link generation. The application consists of a robust backend microservice for data scraping and a modern frontend interface for user interaction.

## Technical Architecture

### Backend Requirements

The backend is implemented as a standalone Node.js microservice with the following specifications:

**Core Technologies:**
- Node.js runtime environment
- Web scraping framework: Puppeteer, Playwright, or Selenium
- Database: PostgreSQL
- Authentication: Traditional email/password system

**Database Schema Requirements:**
- Users table: User authentication and profile data
- DealsCache table: Cached deal information with timestamps
- TrackedProducts table: User-specific product tracking
- BlogPosts table: Content management for blog section

**API Endpoints:**
- `GET /api/deals?limit=&offset=`: Returns JSON with live deals including fetchedAt timestamp and deals array
- `POST /api/track`: Accepts Amazon URL or keyword, returns real-time data including current price, image, and metadata
- `GET /api/track/:userId`: Returns tracked products for a specific user

**Scraping Requirements:**
- Real-time data extraction from Amazon.in
- Proxy rotation using robust free-proxy providers
- Retry and error handling mechanisms
- Latency optimization to meet user-defined thresholds
- Data extraction: titles, prices, images, discounts, search suggestions
- CORS headers for frontend consumption

### Frontend Requirements

The frontend is built using modern web technologies with specific design requirements:

**Core Technologies:**
- React framework
- Tailwind CSS for styling
- Framer Motion for animations
- Poppins font family
- Amazon-orange accent color (#FF9900)

**Layout Structure:**
- Header: Logo (left), navigation links (Deals, Price Tracker, Blog, Login), Sign Up button (right)
- Footer: About, Privacy, Affiliate Disclosure, Social icons, ©2025 copyright

**Section Requirements:**

1. **Hero Section:**
   - Title: "Discover & Track the Hottest Amazon Deals"
   - Subheading and call-to-action buttons: [Get Started], [See Demo]
   - Glassmorphic abstract shapes for visual appeal

2. **Metrics Bar:**
   - Four styled statistics with icons
   - Examples: "200+ Brands," "97% Happy Users," "3m+ Savings"

3. **Deals Dashboard:**
   - Infinite-scroll glass cards grid layout
   - Card content: image, title, price, discount badge
   - Interactive buttons: [Copy Link], [Buy Now] with affiliate tag
   - Hover effects: lift and shine animations
   - "Last fetched" timestamp display

4. **Price Tracker:**
   - Search bar with Amazon real-time autocomplete
   - URL or keyword input support
   - Matched product list with [Track] toggle
   - Sidebar filters: category, price range, discount percentage

5. **Blog Section:**
   - SEO-friendly posts grid from CMS
   - Amazon images, titles, excerpts
   - [Read More] functionality

6. **User Dashboard:**
   - Summary cards: Tracked Items, Alerts Sent, Total Savings
   - Tracked products table: current vs. target price, status, [Remove] option

## Data and DevOps Requirements

### Database Implementation
- Complete schema definitions for all tables
- Migration scripts for database setup
- Proper indexing for performance optimization

### Code Organization
- Clear backend and frontend folder structures
- Componentized React/Tailwind components
- Modular architecture for scalability

### Containerization
- Dockerfiles for both frontend and backend
- Multi-stage builds for optimization
- Environment variable configuration

### CI/CD Pipeline
- GitHub Actions workflows
- Automated testing integration
- Deployment automation

## Critical Requirements

### Data Integrity
- Absolutely no mock data usage
- All displayed data must be live from Amazon.in
- Affiliate tag inclusion in all deal links
- Real-time data synchronization

### Quality Standards
- Production-grade code quality
- Comprehensive error handling
- Scalable architecture design
- Optimal user experience
- Complete integration testing

## Deliverables

The final deliverable includes:
- Complete backend Node.js scraper microservice with proxy rotation
- React frontend with Tailwind CSS and Framer Motion components
- Dockerfiles for backend and frontend
- Database schema definitions and migrations
- GitHub Actions CI/CD workflow files
- Comprehensive documentation for setup, deployment, and usage

All code must be clean, well-commented, and production-ready with no use of mock data.

