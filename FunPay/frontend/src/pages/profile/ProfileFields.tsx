import { useMemo, useState } from "react";
import { AtSign, ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import type { ProfileContactPayload } from "../../api/profileApi";
import { countryCodes, getCountryName, isFuzzyMatch, normalizeSearch } from "../../data/countries";
import { useLanguage } from "../../i18n";
import { contactServices, getServiceDefinition, type ServiceId } from "./contactServices";
import { CountryFlag } from "./ProfileAvatar";

export function CountryPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const countries = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return countryCodes
      .map((code) => ({
        code,
        name: getCountryName(code, language),
        matches: [getCountryName(code, "ru"), getCountryName(code, "uk"), code],
        rank: 1
      }))
      .filter((country) => country.matches.some((item) => isFuzzyMatch(query, item)))
      .map((country) => ({
        ...country,
        rank: country.matches.some((item) => normalizeSearch(item).includes(normalizedQuery)) ? 0 : 1
      }))
      .sort((left, right) => left.rank - right.rank || left.name.localeCompare(right.name, language));
  }, [language, query]);
  const selectedName = value ? getCountryName(value, language) : t("profile.page.countryNone");

  return (
    <div className="country-picker">
      <button className="country-picker__trigger" onClick={() => setIsOpen((current) => !current)} type="button">
        {value && <span className="country-picker__flag"><CountryFlag code={value} /></span>}
        <span>{selectedName}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="country-picker__panel">
          <label className="country-picker__search">
            <Search size={16} aria-hidden="true" />
            <input autoFocus onChange={(event) => setQuery(event.target.value)} placeholder={t("profile.page.countrySearch")} value={query} />
          </label>
          <div className="country-picker__list" role="listbox">
            <button className="country-picker__option" onClick={() => { onChange(""); setIsOpen(false); }} role="option" type="button">
              <span>{t("profile.page.countryNone")}</span>
            </button>
            {countries.map((country) => (
              <button
                className="country-picker__option"
                data-selected={country.code === value}
                key={country.code}
                onClick={() => { onChange(country.code); setIsOpen(false); setQuery(""); }}
                role="option"
                type="button"
              >
                <span className="country-picker__flag"><CountryFlag code={country.code} /></span>
                <span>{country.name}</span>
                <small>{country.code}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ContactEditor({ contacts, onChange }: { contacts: ProfileContactPayload[]; onChange: (contacts: ProfileContactPayload[]) => void }) {
  const { t } = useLanguage();
  const isLimitReached = contacts.length >= 6;

  function addContact(service: ServiceId) {
    if (isLimitReached || (service !== "custom" && contacts.some((contact) => contact.service === service))) {
      return;
    }

    const definition = getServiceDefinition(service);
    onChange([...contacts, { service, title: service === "custom" ? "" : definition.title, url: "" }]);
  }

  function updateContact(index: number, patch: Partial<ProfileContactPayload>) {
    onChange(contacts.map((contact, contactIndex) => contactIndex === index ? { ...contact, ...patch } : contact));
  }

  function moveContact(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= contacts.length) {
      return;
    }

    const next = [...contacts];
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next);
  }

  return (
    <section className="profile-contact-form">
      <div className="profile-section-title"><AtSign size={16} aria-hidden="true" /> {t("profile.page.contacts")}</div>
      <div className="profile-contact-quick-add">
        <span>{t("profile.page.quickAdd")}</span>
        <small>{t("profile.page.contactsLimit", { count: contacts.length })}</small>
        <div>
          {contactServices.map((service) => {
            const Icon = service.Icon;
            const isAdded = service.id !== "custom" && contacts.some((contact) => contact.service === service.id);
            const serviceTitle = service.id === "custom" ? t("extras.customService") : service.title;
            return (
              <button disabled={isLimitReached || isAdded} key={service.id} onClick={() => addContact(service.id)} title={serviceTitle} type="button">
                <Icon size={16} aria-hidden="true" />
                <span>{serviceTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="profile-contact-editor-list">
        {contacts.map((contact, index) => {
          const definition = getServiceDefinition(contact.service);
          const Icon = definition.Icon;
          return (
            <div className="profile-contact-editor-row" key={`${contact.service}-${index}`}>
              <span className="profile-contact-editor-row__icon"><Icon size={20} aria-hidden="true" /></span>
              <label className="profile-field">
                <span>{t("profile.page.contactTitle")}</span>
                {contact.service === "custom" ? (
                  <input onChange={(event) => updateContact(index, { title: event.target.value })} placeholder={t("profile.page.customService")} value={contact.title} />
                ) : (
                  <input readOnly value={definition.title} />
                )}
              </label>
              <label className="profile-field">
                <span>{t("profile.page.contactUrl")}</span>
                <input onChange={(event) => updateContact(index, { url: event.target.value })} placeholder="https://..." type="url" value={contact.url} />
              </label>
              <div className="profile-contact-editor-row__actions">
                <button disabled={index === 0} onClick={() => moveContact(index, -1)} type="button" aria-label={t("profile.page.moveUp")}><ChevronUp size={17} aria-hidden="true" /></button>
                <button disabled={index === contacts.length - 1} onClick={() => moveContact(index, 1)} type="button" aria-label={t("profile.page.moveDown")}><ChevronDown size={17} aria-hidden="true" /></button>
                <button className="profile-contact-editor-row__delete" onClick={() => onChange(contacts.filter((_, contactIndex) => contactIndex !== index))} type="button" aria-label={t("profile.page.removeContact")}><Trash2 size={17} aria-hidden="true" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
