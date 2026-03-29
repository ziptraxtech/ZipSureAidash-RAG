import React from 'react';
import { Zap, Mail, Phone, Globe, MapPin, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 sm:py-12 mt-8 sm:mt-16 border-t border-gray-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <Zap className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold">ZipSureAI</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed max-w-md">
              Empowering smarter energy decisions through advanced IoT monitoring and analytics. 
              Professional battery management solutions for the modern world.
            </p>
            <div className="flex space-x-4">
              <a href="https://zipsureai.com" 
                 className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm">
                <Globe className="mr-2" size={16} />
                Visit Main Website
                <ExternalLink className="ml-1" size={14} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="https://zipsureai.com/" 
                   className="text-gray-400 hover:text-white transition-colors flex items-center">
                  Home
                  <ExternalLink className="ml-1" size={12} />
                </a>
              </li>
              <li>
                <a href="https://zipsureai.com/about-us/" 
                   className="text-gray-400 hover:text-white transition-colors flex items-center">
                  About
                  <ExternalLink className="ml-1" size={12} />
                </a>
              </li>
              <li>
                <a href="https://zipsureai.com/plans/" 
                   className="text-gray-400 hover:text-white transition-colors flex items-center">
                  Plans
                  <ExternalLink className="ml-1" size={12} />
                </a>
              </li>
              <li>
                <a href="https://zipsureai.com/contact-us/" 
                   className="text-gray-400 hover:text-white transition-colors flex items-center">
                  Contact
                  <ExternalLink className="ml-1" size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact</h4>
            <div className="space-y-3 text-sm">
              <a href="mailto:info@zipsureai.com" 
                 className="text-gray-400 hover:text-white transition-colors flex items-center">
                <Mail className="mr-3 text-blue-400" size={16} />
                info@zipsureai.com
              </a>
              <a href="tel:+918368681769" 
                 className="text-gray-400 hover:text-white transition-colors flex items-center">
                <Phone className="mr-3 text-blue-400" size={16} />
                +91 83686 81769
              </a>
              <div className="text-gray-400 flex items-start">
                <MapPin className="mr-3 text-blue-400 mt-0.5" size={16} />
                <span>Battery Monitoring<br />Dashboard Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              &copy; 2024 ZipSureAI. All Rights Reserved.
            </p>
            <div className="text-sm text-gray-400">
              Empowering Smarter Energy Decisions
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;