#! /bin/bash

## Read a CSV file from standard input in the form of:
## <beneficiary_name>, <mm/dd/yy issuance date>, <beneficary_wallet>
## and generate a JSON beneficiaries list with an appropriate vesting date on standard out

#!/bin/bash

# Read the CSV file from standard input
IFS=","  # Set the field separator to comma

# Initialize variables
count=0
beneficiaries=()

while read -r name issuance_date wallet_address; do
  # Increment the count
  ((count++))

  # trim leading and trailing whitespace from CSV entries
  name=$(echo $name | sed -e 's/^[[:space:]]*//')
  issuance_date=$(echo $issuance_date | sed -e 's/^[[:space:]]*//')
  wallet_address=$(echo $wallet_address | sed -e 's/^[[:space:]]*//')

  # Convert issuance_date to Unix epoch timestamp -- MAC OS SPECIFIC
  epoch_timestamp=$(date -jf "%m/%d/%Y %H:%M:%S" "$issuance_date 00:00:00" +%s)

  # Compute midnight Pacific time one year from issuance_date
  midnight_pt_timestamp=$((epoch_timestamp + 3600*24*365))

  # Create beneficiary entry
  beneficiary=("$wallet_address" "$midnight_pt_timestamp" 360 "$name")
  
  # Add beneficiary entry to the beneficiaries array
  beneficiaries+=("[ \"${beneficiary[0]}\", ${beneficiary[1]}, ${beneficiary[2]}, \"${beneficiary[3]}\"],")
done

# Trim trailing comma from last entry
benes=$(echo "${beneficiaries[@]}" | sed 's/,$//')

# wrap in proper JSON array brackets
benes="[ ${benes} ]"

# Construct the JSON output
json_output=$(jq -n --arg count "$count" --argjson beneficiaries "${benes}" \
  '{"count": $count, "beneficiaries": $beneficiaries}')

# Output the JSON
echo "$json_output"
