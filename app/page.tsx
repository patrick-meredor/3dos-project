import Footer from "@/components/footer";
import Header from "@/components/header";
import Main from "@/components/main";
import Roadmap from "@/app/roadmap/page";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center sm:p-5">
      <Header />
      <Main />
      {/* <Footer /> */}
    </div>
  );
}

