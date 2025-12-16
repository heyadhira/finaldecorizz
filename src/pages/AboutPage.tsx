import React from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";
import aboutImg from "../assets/5.jpg";
import canvaImg from "../assets/canva.jpg";
import heroImg from "../assets/hero.jpg";
import lordramaImg from "../assets/lordrama.jpg";
import owlImg from "../assets/owl.jpg";
import image1 from "../assets/1.jpg";
import image2 from "../assets/2.jpg";
import image3 from "../assets/3.jpg";
import image4 from "../assets/4.jpg";
import logor  from  "../assets/logo.png"




export default function AboutPage() {
  return (
    <div className="dark-theme min-h-screen content-offset">
      <Navbar />

{/* HERO HEADER */}
<section className="max-w-7xl relative mx-auto overflow-hidden rounded-lg mt-12 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="soft-card p-8 sm:p-12 card-appear">
            <h1 className="text-center custom-heading">
              About <span style={{ color: "#14b8a6" }}>Us</span>
            </h1>
            <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#cbd5e1" }}>
              Curated frames to elevate every room
            </p>
          </div>
        </div>
      </section>



      {/* WHO WE ARE */}
      <section id="who-we-are" className="max-w-7xl relative mx-auto overflow-hidden rounded-lg mb-12">
        <div className="soft-card p-10 lg:p-14 card-appear p-6 mb-">
          <h2
  className="custom-heading mb-4 ml-6 pb-2 border-b-2 border-[#14b8a6] mt-6 inline-block"
>
  Who We <span style={{ color: "#14b8a6" }}>Are</span>
</h2>


          <p className="text-xl font-bold text-[#14b8a6] pl-6">
            We are a small, passionate team of creators, designers, and storytellers who believe
            that art can transform the energy of any room.
            <br />
            Our journey began with one vision  to create artwork that makes people feel
            something. Not just decorations, but expressive pieces that add soul to a space.
            
            <br />
            Every collection we create goes through a long process of sketching, refining, 
            color exploration, and visual storytelling.



          </p>

          <p className="text-xl font-bold text-[#14b8a6] pl-6">
            “Would I hang this in my own home?”
          </p>

          <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
            If the answer isn’t a confident yes  we don’t publish it.
            
            <br />
            Our inspiration spans minimalism, pop-art, abstract, photography, shapes, patterns,
            and the world around us  creating a blend of fresh, modern, and expressive art.
            
            <br />
            Beyond the artwork, we deeply care about how you feel when you receive it.
            We want your space to feel more YOU.
          </p>
        </div>
      </section>
{/* Why choose us */}
 <section className="max-w-7xl relative mx-auto overflow-hidden rounded-lg">
     <div className="soft-card p-10 lg:p-14 card-appear p-6">

    {/* TITLE */}
    <h2 className="section-title mb-4 ml-6 pb-2 border-b-2 border-[#14b8a6] mt-6 inline-block">
      <span>Why</span>
      <span style={{ color: "#14b8a6" }}> Choose Us</span>
    </h2>

    <div className="grid md:grid-cols-2 gap-12 items-center">

       {/* left IMAGES */}
      <div className="soft-card p-6">
        <div className="grid grid-cols-2 gap-4 ">
          {[canvaImg, owlImg].map((src, i) => (
            <div key={i} className="overflow-hidden rounded-xl ">
              <img
                src={src}
                className="w-full h-32 object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* right TEXT */}
      <div className="space-y-4">
        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
          Choose us because we genuinely care about what goes on your wall. Our
          designs are original, our materials are premium, and our team provides
          real human support not automated messages.
        </p>

        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
           With Decorizz, you're not just buying wall art  you’re bringing home
          something crafted with intention.
        </p>

      </div>

     

    </div>

  </div>
</section>

{/* OUR MISSION */}
<section className="max-w-7xl relative mx-auto overflow-hidden rounded-lg mt-12">
  <div className="soft-card p-10 lg:p-14 card-appear p-6">

    {/* TITLE */}
    <h2 className="custom-heading mb-4 ml-6 pb-2 border-b-2 border-[#14b8a6] mt-6 inline-block">
      <span className="text-[#3b2f27]">Our</span>
      <span style={{ color: "#14b8a6" }}> Mission</span>
    </h2>

    <div className="grid md:grid-cols-2 gap-12 items-center">

      {/* LEFT TEXT */}
      <div className="space-y-6">
        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
          Every piece we create is designed to add joy, emotion, and depth
          to your home  one wall at a time.
        </p>

        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
          Our mission is simple: make decorating effortless, enjoyable, and 
          meaningful, helping people express personality through living art.
        </p>

        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
          We believe your walls should reflect who you are  your style, your
          story, and the moments that matter most.
        </p>
      </div>

      {/* RIGHT IMAGES */}
      <div className="soft-card p-6">
        <div className="grid grid-cols-2 gap-4">
          {[image2, image1, image3, image4].map((src, i) => (
            <div key={i} className="overflow-hidden rounded-xl">
              <img
                src={src}
                className="w-full h-32 object-cover transition-all duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

    </div>

  </div>
</section>


 <section className="max-w-7xl relative mx-auto overflow-hidden rounded-lg mt-12">
     <div className="soft-card p-10 lg:p-14 card-appear p-6">

    {/* TITLE */}
    <h2 className="custom-heading mb-4 ml-6 pb-2 border-b-2 border-[#14b8a6] mt-6 inline-block">
      <span className="text-[#3b2f27]">Why We</span>
      <span style={{ color: "#14b8a6" }}> Stand Out</span>
    </h2>

    <div className="grid md:grid-cols-2 gap-12 items-center">


       {/* left IMAGES */}
      <div className="soft-card p-6">
        <div className="grid grid-cols-2 gap-4">
          {[heroImg,logor].map((src, i) => (
            <div key={i} className="overflow-hidden rounded-xl">
              <img
                src={src}
                className="w-full h-32 object-cover transition-all duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* right TEXT */}
      <div className="space-y-6">
        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
          At Decorizz, we don’t mass-produce art  we create it with heart.
        </p>

        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
          Every artwork is thoughtfully designed, carefully reviewed, and crafted to bring
            warmth and character into your space.
        </p>

        <p className="text-xl font-bold text-[#14b8a6] pl-6 mb-6">
          When you shop with Decorizz, you're choosing creativity, not templates.
        </p>

      </div>
    </div>

  </div>
</section>



      {/* CONTACT */}
   <section className="max-w-7xl relative mx-auto overflow-hidden rounded-lg mt-12 mb-12">
  <div className="soft-card p-6 lg:p-14 space-y-8 card-appear">

    {/* Section Title */}
    <h2 className="custom-heading mb-4 ml-6 pb-2 border-b-2 border-[#14b8a6] mt-6 inline-block">
      Contact <span style={{ color: "#14b8a6" }}>Us</span>
    </h2>

    {/* TWO COLUMN LAYOUT */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* LEFT COLUMN – CONTACT DETAILS */}
      <div className="space-y-8 pl-6 px-4 text-xl font-bold text-[#14b8a6]">

        <ContactItem
          icon={<MapPin className="w-6 h-6" color="#14b8a6" />}
          title="Address"
          text="Gurugram road Near Subhash chowk Shaktifarm market Sitarganj Udham Singh Nagar 263151"
        />

        <ContactItem
          icon={<Phone className="w-6 h-6" color="#14b8a6" />}
          title="Phone"
          text="+91 9705180483"
        />

        <ContactItem
          icon={<Mail className="w-6 h-6" color="#14b8a6" />}
          title="Email"
          text="contact@decorizz.com"
        />

      </div>


      {/* RIGHT COLUMN – GOOGLE MAP */}
<div className="soft-card p-2 rounded-xl overflow-hidden shadow-md border border-[#e6ddd4]">
  
  
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3489.2669416026324!2d79.64781057555636!3d29.00908607546123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a061f87cc0f677%3A0xe5fb13c9df318542!2sShakti%20farm%20market!5e0!3m2!1sen!2sin!4v1765270792894!5m2!1sen!2sin"
    width="100%"
    height="350"
    style={{
      border: "0",
      borderRadius: "18px",
     
    }}
    allowFullScreen=""
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
</div>


    </div>
  </div>
</section>


      <Footer />
    </div>
  );
}

function ContactItem({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3 mt-6">
      {icon}
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}
