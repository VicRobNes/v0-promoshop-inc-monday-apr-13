"use client"

import { Mail, Phone, MapPin } from "lucide-react"
import { useState } from "react"
import { useLocale } from "@/lib/locale-context"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  })
  const [submitted, setSubmitted] = useState(false)
  const { config } = useLocale()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section className="py-16 lg:py-20 px-6 lg:px-8 bg-[#111111]" id="contact">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-2xl lg:text-3xl text-white mb-3">
            Contact Us
          </h2>
          <p className="text-[#888] max-w-xl mx-auto font-visby leading-relaxed">
            Have questions? Need a custom quote? Our team is here to help bring your vision to life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Info (locale-aware) */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#ea4a3f]/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[#ea4a3f]" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-white mb-2">Phone</h3>
                <div className="space-y-1 text-[#888] font-visby">
                  {config.allContacts.map((contact) => (
                    <p key={contact.phoneHref}>
                      <span className="text-[#666] text-sm">{contact.phoneLabel}: </span>
                      <a href={contact.phoneHref} className="hover:text-[#ea4a3f] transition-colors">{contact.phone}</a>
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#ea4a3f]/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#ea4a3f]" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-white mb-2">Email</h3>
                <a 
                  href="mailto:info@promoshopinc.com" 
                  className="text-[#888] hover:text-[#ea4a3f] transition-colors font-visby"
                >
                  info@promoshopinc.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#ea4a3f]/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#ea4a3f]" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-white mb-2">Locations</h3>
                <div className="text-[#888] space-y-1 font-visby">
                  {config.allContacts.map((contact) => (
                    <p key={contact.phoneHref}>{contact.city}, {contact.region}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 shadow-sm">
            {submitted ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#6abf4b]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#6abf4b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-montserrat font-bold text-xl text-white mb-2">Message Sent!</h3>
                  <p className="text-[#888] font-visby">We&apos;ll get back to you shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded text-sm font-visby focus:border-[#ea4a3f] focus:outline-none transition-colors placeholder:text-[#555]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded text-sm font-visby focus:border-[#ea4a3f] focus:outline-none transition-colors placeholder:text-[#555]"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="company" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded text-sm font-visby focus:border-[#ea4a3f] focus:outline-none transition-colors placeholder:text-[#555]"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 rounded text-sm font-visby focus:border-[#ea4a3f] focus:outline-none transition-colors resize-none placeholder:text-[#555]"
                    placeholder="Tell us about your project..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#ea4a3f] text-white py-3.5 font-bold uppercase tracking-wider text-sm rounded hover:opacity-90 transition-opacity"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
