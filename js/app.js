// Main application logic and routing

class HotelApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.init();
  }
  
  init() {
    // Initialize sample data
    initializeSampleData();
    
    // Setup event listeners
    this.setupNavigation();
    this.setupMobileMenu();
    
    // Load initial page
    this.loadPage(window.location.hash.slice(1) || 'dashboard');
    
    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
      this.loadPage(window.location.hash.slice(1) || 'dashboard');
    });
  }
  
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.loadPage(page);
        window.location.hash = page;
      });
    });
  }
  
  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
    });
    
    overlay.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    });
  }
  
  loadPage(pageName) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    // Close mobile menu
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('overlay').classList.add('hidden');
    
    // Load page content
    const mainContent = document.getElementById('mainContent');
    this.currentPage = pageName;
    
    switch (pageName) {
      case 'dashboard':
        mainContent.innerHTML = Dashboard.render();
        Dashboard.init();
        break;
      case 'rooms':
        mainContent.innerHTML = Rooms.render();
        Rooms.init();
        break;
      case 'bookings':
        mainContent.innerHTML = Bookings.render();
        Bookings.init();
        break;
      case 'guests':
        mainContent.innerHTML = Guests.render();
        Guests.init();
        break;
      case 'billing':
        mainContent.innerHTML = Billing.render();
        Billing.init();
        break;
      case 'settings':
        mainContent.innerHTML = Settings.render();
        Settings.init();
        break;
      default:
        mainContent.innerHTML = '<div class="text-center py-20"><h1 class="text-2xl font-bold text-muted-foreground">Page Not Found</h1></div>';
    }
  }
  
  refreshCurrentPage() {
    this.loadPage(this.currentPage);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new HotelApp();
});