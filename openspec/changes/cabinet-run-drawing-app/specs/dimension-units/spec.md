## Purpose

Lets users enter and read lengths the way US builders write them, as inches with fractions, while the app stores every length exactly with no floating point drift.

## ADDED Requirements

### Requirement: Lengths are stored as whole sixteenths of an inch
The system SHALL represent every length as an integer number of sixteenths of an inch. Arithmetic on lengths (sums of widths, differences of heights) SHALL be exact integer arithmetic.

#### Scenario: Sum of fractional widths is exact
- **WHEN** three items of width 35 1/4", 24", and 20 3/4" are laid out in a row
- **THEN** the row's total width is exactly 80"

### Requirement: Length input accepts common inch notations
The system SHALL parse the following forms into sixteenths: whole inches (`36`), whole plus fraction separated by a space or hyphen (`35 1/4`, `35-1/4`), a bare fraction (`3/4`), and decimal inches (`35.25`). A trailing double quote or `in` SHALL be accepted and ignored. Surrounding whitespace SHALL be ignored. Decimal input SHALL be rounded to the nearest sixteenth.

#### Scenario: Whole plus fraction
- **WHEN** the user enters `35 1/4`
- **THEN** the value is 564 sixteenths

#### Scenario: Decimal rounds to nearest sixteenth
- **WHEN** the user enters `35.3`
- **THEN** the value is 565 sixteenths (35 5/16")

#### Scenario: Trailing unit mark ignored
- **WHEN** the user enters `24"` or `24 in`
- **THEN** the value is 384 sixteenths

### Requirement: Invalid length input is rejected
The system SHALL reject input that is empty, not a number, has a fraction with a zero denominator, or is negative. Rejection SHALL return an error message and SHALL NOT produce a value.

#### Scenario: Non-numeric input
- **WHEN** the user enters `abc`
- **THEN** parsing fails with an error and no length is produced

#### Scenario: Negative input
- **WHEN** the user enters `-12`
- **THEN** parsing fails with an error and no length is produced

### Requirement: Lengths are displayed as inches with reduced fractions
The system SHALL format a length as whole inches followed by a reduced fraction in sixteenths, eighths, quarters, or halves, and a trailing double quote. Whole values SHALL omit the fraction. Values under one inch SHALL show only the fraction. Zero SHALL display as `0"`.

#### Scenario: Reduced fraction
- **WHEN** a length of 568 sixteenths is formatted
- **THEN** the output is `35 1/2"`

#### Scenario: Whole inches
- **WHEN** a length of 384 sixteenths is formatted
- **THEN** the output is `24"`

#### Scenario: Fraction only
- **WHEN** a length of 12 sixteenths is formatted
- **THEN** the output is `3/4"`
