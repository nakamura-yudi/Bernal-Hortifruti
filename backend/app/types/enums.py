from enum import Enum


class Environment(str, Enum):
    development = "development"
    staging = "staging"
    production = "production"
