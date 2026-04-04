export interface NestedSkill {
  skill_id: number;
  skill_name: string;
}
export interface NestedLanguage {
  language_id: number;
  language_name: string;
}
export interface NestedPreference {
  pref_id: number;
  preference: string;
}
export interface UserData {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  gender: string;
  skills: NestedSkill[];
  languages: NestedLanguage[];
  preferences: NestedPreference[];
  max_distance_preferred: number;
  phone_number: string;
  sub_duty_preference: boolean;
}