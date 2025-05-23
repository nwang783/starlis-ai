import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between space-y-4 py-6 md:flex-row md:space-y-0">
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center space-x-2" aria-label="Logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 96.262 96.262"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="text-foreground"
            >
              <path
                d="M48.131,0C21.591,0,0,21.591,0,48.131s21.591,48.131,48.131,48.131s48.131-21.591,48.131-48.131S74.671,0,48.131,0z
                M80.992,32.785c-2.414,4.063-10.229,5.382-23.574,7.22c-3.625,0.499-6.949,1.961-8.478,4.647
                c-0.727,1.277-0.755,2.554-0.088,4.015c1.908,4.178,6.298,7.169,10.542,10.062c1.375,0.938,2.668,1.817,3.918,2.762
                c4.229,3.199,11.26,10.824,7.588,16.799c-2.586,4.206-12.254,9.945-23.025,9.633c-17.41-0.505-33.853-12.125-37.026-29.818
                c0,0-0.64-3.619,2.73-3.324c3.834,0.336,10.058,4.143,14.603,6.867c11.09,6.65,13.122,4.314,13.534,3.488
                c1.462-2.932,0.195-6.8-1.073-9.842c-0.489-1.176-1.123-2.361-1.793-3.62c-1.954-3.664-4.168-7.817-3.203-12.813
                c0.798-4.129,4.344-6.122,7.192-7.725c1.244-0.698,2.417-1.358,3.163-2.059c1.741-1.636,2.682-3.978,2.777-6.774
                c0.185-5.462-4.294-9.612-3.522-12.186c0.717-2.391,5.283-1.776,5.364-1.771c13.367,0.926,24.859,8.179,29.992,18.93
                C80.63,27.307,82.227,30.704,80.992,32.785z"
              />
            </svg>
            <span className="text-xl font-bold">Acme</span>
          </Link>
          <p className="text-sm text-muted-foreground">Modern SaaS solutions for businesses of all sizes.</p>
        </div>
        <div className="flex flex-col items-center space-y-2 md:items-start">
          <p className="text-sm font-bold">Products</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <Link href="#">Features</Link>
            <Link href="#">Integrations</Link>
            <Link href="#">Pricing</Link>
            <Link href="#">FAQ</Link>
          </div>
        </div>
        <div className="flex flex-col items-center space-y-2 md:items-start">
          <p className="text-sm font-bold">Company</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <Link href="#">About</Link>
            <Link href="#">Careers</Link>
            <Link href="#">Support</Link>
            <Link href="#">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

