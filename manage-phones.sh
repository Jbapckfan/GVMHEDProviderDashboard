#!/bin/bash

# GVMH ED Provider Dashboard - Phone Directory Manager
# Quick script to manage phone numbers

DB_PATH="$HOME/GVMHEDProviderDashboard/backend/data/dashboard.db"

show_menu() {
    echo ""
    echo "========================================="
    echo "   GVMH Phone Directory Manager"
    echo "========================================="
    echo "1. View all phone numbers"
    echo "2. Add new phone number"
    echo "3. Update phone number"
    echo "4. Delete phone number"
    echo "5. Exit"
    echo "========================================="
    read -p "Choose an option: " choice

    case $choice in
        1) view_phones ;;
        2) add_phone ;;
        3) update_phone ;;
        4) delete_phone ;;
        5) exit 0 ;;
        *) echo "Invalid option"; show_menu ;;
    esac
}

view_phones() {
    echo ""
    echo "Current Phone Directory:"
    echo "------------------------"
    sqlite3 "$DB_PATH" "SELECT id, name, number, extension, department FROM phone_directory ORDER BY display_order;" | \
        awk -F'|' '{printf "%d. %s: %s (ext %s) - %s\n", $1, $2, $3, $4, $5}'
    echo ""
    show_menu
}

add_phone() {
    echo ""
    echo "Add New Phone Number"
    echo "--------------------"
    read -p "Name (e.g., 'Cardiology Consult'): " name
    read -p "Phone Number (e.g., '555-1234'): " number
    read -p "Extension (optional): " extension
    read -p "Department: " department
    read -p "Display Order (number): " order

    sqlite3 "$DB_PATH" "INSERT INTO phone_directory (name, number, extension, department, display_order) VALUES ('$name', '$number', '$extension', '$department', $order);"

    echo "✓ Phone number added successfully!"
    show_menu
}

update_phone() {
    view_phones
    read -p "Enter ID of phone number to update: " id

    echo ""
    echo "Leave blank to keep current value"
    read -p "New Name: " name
    read -p "New Number: " number
    read -p "New Extension: " extension
    read -p "New Department: " department

    if [ ! -z "$name" ]; then
        sqlite3 "$DB_PATH" "UPDATE phone_directory SET name='$name' WHERE id=$id;"
    fi
    if [ ! -z "$number" ]; then
        sqlite3 "$DB_PATH" "UPDATE phone_directory SET number='$number' WHERE id=$id;"
    fi
    if [ ! -z "$extension" ]; then
        sqlite3 "$DB_PATH" "UPDATE phone_directory SET extension='$extension' WHERE id=$id;"
    fi
    if [ ! -z "$department" ]; then
        sqlite3 "$DB_PATH" "UPDATE phone_directory SET department='$department' WHERE id=$id;"
    fi

    echo "✓ Phone number updated successfully!"
    show_menu
}

delete_phone() {
    view_phones
    read -p "Enter ID of phone number to delete: " id
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        sqlite3 "$DB_PATH" "DELETE FROM phone_directory WHERE id=$id;"
        echo "✓ Phone number deleted successfully!"
    else
        echo "Cancelled"
    fi

    show_menu
}

# Start the script
show_menu
