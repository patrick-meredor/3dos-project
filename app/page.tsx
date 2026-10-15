import Header from "@/components/header";
import Main from "@/components/main";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center pt-16 sm:p-5 sm:pt-24 px-3 sm:px-6 overflow-x-hidden">
      <Header />
      <Main />
      {/* <Footer /> */}
    </div>
  );
}

