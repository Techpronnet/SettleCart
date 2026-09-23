export function MultiBusinessSection() {
  const categories = [
    {
      name: "Fashion",
      example: "Contemporary wear, tailored suits, bags & accessories",
      items: "Adire shirts, leather sandals, linen dresses",
      icon: "fa fa-shopping-bag",
    },
    {
      name: "Food",
      example: "Restaurants, cloud kitchens, bakeries & lunch spots",
      items: "Rice bowls, baked pastries, fresh juices",
      icon: "fa fa-cutlery",
    },
    {
      name: "Grocery",
      example: "Supermarkets, farm shops & neighborhood provisions",
      items: "Fresh spices, cooking oils, grains, pantry goods",
      icon: "fa fa-shopping-basket",
    },
    {
      name: "Beauty",
      example: "Organic skincare, haircare & salon care",
      items: "Shea butter creams, essential oils, hair styling",
      icon: "fa fa-magic",
    },
    {
      name: "Retail",
      example: "Home goods, stationery, electronics & lifestyle",
      items: "Ceramics, notebooks, headphones, home decor",
      icon: "fa fa-cube",
    },
    {
      name: "Services",
      example: "Appointments, creative agencies & consultants",
      items: "Studio sessions, business advisory, styling",
      icon: "fa fa-briefcase",
    },
    {
      name: "Repairs",
      example: "Device diagnostics, appliance care & alterations",
      items: "Screen replacements, tailoring adjustments",
      icon: "fa fa-wrench",
    },
    {
      name: "Digital",
      example: "Digital products, guides, templates & software",
      items: "Design assets, financial templates, ebooks",
      icon: "fa fa-laptop",
    },
  ];

  return (
    <section className="fluid-section bg-[#fafaf9] border-b border-stone-200/80">
      <div className="site-container">
        
        {/* Header */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <h2 className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight">
            One marketplace. Many kinds of businesses.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl">
            Whether you sell clothes, groceries, meals, services, beauty products, or something completely different, the platform is designed around the way businesses actually operate.
          </p>
        </div>

        {/* 2-Column Mobile, 3-Column Tablet, 4-Column Desktop Category Grid */}
        <div className="pt-6 border-t border-stone-200/80 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="group bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-5 flex flex-col justify-between hover:border-stone-400/80 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-tight">
                    {cat.name}
                  </h3>
                  <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center text-xs group-hover:bg-stone-900 group-hover:text-white transition-colors">
                    <i className={cat.icon} aria-hidden="true" />
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed">
                  {cat.example}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-stone-100">
                <span className="text-[10px] text-stone-400 block font-medium">Common items:</span>
                <span className="text-[11px] text-stone-700 font-normal leading-snug line-clamp-2">
                  {cat.items}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
