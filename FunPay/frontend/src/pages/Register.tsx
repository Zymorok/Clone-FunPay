import { MarketPreview } from "../components/MarketPreview";
import { RegisterForm } from "./register/RegisterForm";

const cornerCatPath = "/assets/website/animations/characters/cat_movement.svg";

export function Register() {
  return (
    <>
      <main className="register-page mx-auto grid max-w-[1260px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <RegisterForm />
        <MarketPreview />
      </main>

      <div className="corner-cat" aria-hidden="true">
        <img src={cornerCatPath} alt="" draggable="false" />
      </div>
    </>
  );
}
