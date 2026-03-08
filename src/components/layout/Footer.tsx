import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-3">SibMicro</h3>
        <p className="text-sm opacity-80 leading-relaxed">
          Your trusted partner for electronic components. Over 1,000,000 parts in stock from leading manufacturers.
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Products</h4>
        <ul className="space-y-1.5 text-sm opacity-80">
          <li><Link to="/catalog?category=semiconductors" className="hover:opacity-100">Semiconductors</Link></li>
          <li><Link to="/catalog?category=passive-components" className="hover:opacity-100">Passive Components</Link></li>
          <li><Link to="/catalog?category=rf-microwave" className="hover:opacity-100">RF & Microwave</Link></li>
          <li><Link to="/catalog?category=connectors" className="hover:opacity-100">Connectors</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Services</h4>
        <ul className="space-y-1.5 text-sm opacity-80">
          <li><Link to="/quote" className="hover:opacity-100">Request Quote</Link></li>
          <li><Link to="/bom" className="hover:opacity-100">BOM Upload</Link></li>
          <li><Link to="/resources" className="hover:opacity-100">Technical Resources</Link></li>
          <li><Link to="/contact" className="hover:opacity-100">Contact Sales</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Contact</h4>
        <ul className="space-y-1.5 text-sm opacity-80">
          <li>📞 +7 (495) 123-45-67</li>
          <li>✉ sales@sibmicro.com</li>
          <li>🏢 Moscow, Russia</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-primary-foreground/20">
      <div className="container py-4 text-xs opacity-60 text-center">
        © 2026 SibMicro. All rights reserved. | ISO 9001 Certified | ITAR Registered
      </div>
    </div>
  </footer>
);

export default Footer;
