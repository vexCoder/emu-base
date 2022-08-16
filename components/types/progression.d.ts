declare namespace XMLProgression {
  export type Type = {
    progression: Parsed;
  };

  export interface Parsed {
    level: Level;
    attributes: Attributes;
    skills: Skills;
    perks: Perks;
  }

  export interface Level {
    max_level: string;
    exp_to_level: string;
    experience_multiplier: string;
    skill_points_per_level: string;
    clamp_exp_cost_at_level: string;
  }

  export interface Attributes {
    attribute: Attribute[];
    min_level: string;
    max_level: string;
    base_skill_point_cost: string;
    cost_multiplier_per_level: string;
  }

  export interface Attribute {
    level_requirements?: LevelRequirement[];
    effect_group: any;
    name: string;
    name_key: string;
    desc_key: string;
    icon: string;
    min_level?: string;
    max_level?: string;
    base_skill_point_cost?: string;
  }

  export interface LevelRequirement {
    requirement: Requirement;
    level: string;
  }

  export interface Requirement {
    name: string;
    operation: string;
    value: string;
    desc_key: string;
  }

  export interface Skills {
    skill: Skill[];
    min_level: string;
    max_level: string;
  }

  export interface Skill {
    effect_group: string;
    name: string;
    parent: string;
    name_key: string;
    desc_key?: string;
    icon: string;
    long_desc_key?: string;
  }

  export interface Perks {
    perk: Perk[];
    min_level: string;
    max_level: string;
    base_skill_point_cost: string;
    cost_multiplier_per_level: string;
    max_level_ratio_to_parent: string;
  }

  export interface Perk {
    level_requirements?: PerkLevelRequirement[];
    effect_group: any;
    name: string;
    parent: string;
    name_key?: string;
    desc_key: string;
    icon?: string;
    max_level?: string;
    base_skill_point_cost?: string;
    long_desc_key?: string;
  }

  export interface PerkLevelRequirement {
    requirement: PerkLevelRequirementRequirement;
    level: string;
  }

  export interface PerkLevelRequirementRequirement {
    name: string;
    progression_name: string;
    operation: string;
    value: string;
    desc_key: string;
  }
}
