import Footer from "@/components/footer";
import Header from "@/components/header";
import Main from "@/components/main";
import Roadmap from "@/app/roadmap/page";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center pt-20 sm:p-5 sm:pt-24">
      <Header />
      <Main />
      {/* <Footer /> */}
    </div>
  );
}

