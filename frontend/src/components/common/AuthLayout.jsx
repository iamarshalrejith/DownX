
import React from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import loginpage_img from "../../assets/loginpage_img.jpg";

const AuthLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen w-full bg-bg lg:grid-cols-2">

      {/* LEFT: BRANDING */}
      <section className="relative hidden min-h-screen overflow-hidden bg-brand-dark lg:flex lg:flex-col lg:justify-between">

        <img
          src={loginpage_img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/95 via-brand-dark/85 to-brand/80" />

        <div className="absolute -right-28 top-20 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-12 top-36 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/5" />

        <button
          onClick={() => navigate("/")}
          title="Go back"
          className="absolute left-8 top-8 z-20 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-brand-dark"
        >
          <IoArrowBack size={21} />
        </button>

        <div className="relative z-10 p-12 pt-28 xl:p-16">

          {/* LOGO */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-brand">
              D
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-white">
                DownX
              </h1>
              <p className="text-sm text-white/70">
                Learn. Grow. Shine.
              </p>
            </div>
          </div>

          {/* BRAND MESSAGE */}
          <div className="mt-24 max-w-lg">

            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              Learning without limits
            </span>

            <h2 className="mt-7 text-4xl font-extrabold leading-tight text-white xl:text-5xl">
              Every step forward is a reason to shine.
            </h2>

            <p className="mt-6 max-w-md text-base leading-8 text-white/75">
              A supportive learning space where students, teachers and
              families grow together, one achievement at a time.
            </p>

          </div>
        </div>

        {/* FOOTER */}
        <div className="relative z-10 flex items-center justify-between p-12 text-sm text-white/60 xl:px-16">
          <span>© {new Date().getFullYear()} DownX</span>
          <span>Learn. Grow. Shine.</span>
        </div>
      </section>

      {/* RIGHT: FORM - NO CARD */}
      <section className="relative flex min-h-screen flex-col justify-center bg-bg px-6 py-10 sm:px-12 lg:px-16 xl:px-24">

        {/* MOBILE BRAND */}
        <div className="mb-12 flex items-center justify-between lg:hidden">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-xl font-extrabold text-white">
              D
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-brand-dark">
                DownX
              </h1>
              <p className="text-xs text-ink-soft">
                Learn. Grow. Shine.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-brand"
          >
            <IoArrowBack size={20} />
          </button>
        </div>

        {/* FORM CONTENT DIRECTLY ON BACKGROUND */}
        <div className="mx-auto w-full max-w-md">

          <div className="mb-8">
            <span className="inline-flex rounded-xl bg-brand-light px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand">
              Welcome to DownX
            </span>
          </div>

          {children}

          {/* FOOTER MESSAGE */}
          <div className="mt-10 border-t border-border pt-6 text-center">
            <p className="text-xs leading-5 text-ink-soft">
              A little progress each day adds up to big achievements.
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-ink-soft">
            Made with care for every learner.
          </p>

        </div>
      </section>
    </main>
  );
};

export default AuthLayout;
