#!/usr/bin/env python3
"""
Test script for Riot API key validation using the modern Riot ID approach.
This script tests the account-v1 endpoint which is the recommended way to get player information.
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from root .env file
load_dotenv(".env")

def test_riot_api():
    # Get API key from environment
    api_key = os.getenv('RIOT_API_KEY')
    
    if not api_key:
        print("❌ RIOT_API_KEY not found in environment variables")
        print("Please make sure your .env file is set up correctly in the server directory")
        return False
    
    print(f"🔑 API Key found (length: {len(api_key)})")
    
    # Test data
    game_name = "nilejr"
    tag_line = "NA1"
    region = "americas"  # Regional endpoint for account-v1
    
    # Test 1: Get account by Riot ID (account-v1 endpoint)
    print(f"\n🧪 Test 1: Getting account for {game_name}#{tag_line}")
    
    account_url = f"https://{region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
    headers = {
        'X-Riot-Token': api_key
    }
    
    try:
        response = requests.get(account_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            account_data = response.json()
            print("✅ Account data retrieved successfully!")
            print(f"   PUUID: {account_data['puuid']}")
            print(f"   Game Name: {account_data.get('gameName', 'N/A')}")
            print(f"   Tag Line: {account_data.get('tagLine', 'N/A')}")
            
            # Test 2: Get summoner data using PUUID
            print(f"\n🧪 Test 2: Getting summoner data using PUUID")
            
            puuid = account_data['puuid']
            platform = "na1"  # Platform endpoint for summoner-v4
            summoner_url = f"https://{platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
            
            summoner_response = requests.get(summoner_url, headers=headers, timeout=10)
            
            if summoner_response.status_code == 200:
                summoner_data = summoner_response.json()
                print("✅ Summoner data retrieved successfully!")
                print(f"   Summoner ID: {summoner_data['id']}")
                print(f"   Account ID: {summoner_data['accountId']}")
                print(f"   Summoner Level: {summoner_data['summonerLevel']}")
                print(f"   Profile Icon ID: {summoner_data['profileIconId']}")
                
                print(f"\n🎉 API Key is working correctly with modern Riot ID approach!")
                return True
            else:
                print(f"❌ Failed to get summoner data: {summoner_response.status_code}")
                print(f"   Response: {summoner_response.text}")
                return False
                
        elif response.status_code == 403:
            print("❌ API key is invalid or expired (403 Forbidden)")
            print("   Please check your API key at https://developer.riotgames.com/")
            return False
        elif response.status_code == 404:
            print("❌ Account not found (404)")
            print(f"   No account found for {game_name}#{tag_line}")
            return False
        else:
            print(f"❌ Unexpected error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False

def test_local_server():
    """Test the local server endpoints"""
    base_url = "http://localhost:4000/api"
    
    print(f"\n🌐 Testing local server endpoints...")
    
    # Test debug endpoint
    try:
        response = requests.get(f"{base_url}/debug", timeout=5)
        if response.status_code == 200:
            debug_data = response.json()
            print("✅ Server is running!")
            print(f"   Has API Key: {debug_data['hasApiKey']}")
            print(f"   API Key Length: {debug_data['apiKeyLength']}")
            
            # Test new account endpoint
            print(f"\n🧪 Testing new account endpoint...")
            account_response = requests.get(f"{base_url}/account/na1/nilejr/NA1", timeout=10)
            
            if account_response.status_code == 200:
                print("✅ Account endpoint working!")
                account_data = account_response.json()
                if account_data['success']:
                    print(f"   PUUID: {account_data['data']['puuid']}")
                    print(f"   Game Name: {account_data['data'].get('gameName', 'N/A')}")
                    print(f"   Tag Line: {account_data['data'].get('tagLine', 'N/A')}")
                    
                    # Test complete profile endpoint
                    print(f"\n🧪 Testing complete profile endpoint...")
                    profile_response = requests.get(f"{base_url}/profile/na1/nilejr/NA1", timeout=10)
                    
                    if profile_response.status_code == 200:
                        print("✅ Complete profile endpoint working!")
                        profile_data = profile_response.json()
                        if profile_data['success']:
                            account = profile_data['data']['account']
                            summoner = profile_data['data']['summoner']
                            print(f"   Account PUUID: {account['puuid']}")
                            print(f"   Summoner Level: {summoner['summonerLevel']}")
                            print(f"   Profile Icon ID: {summoner['profileIconId']}")
                    else:
                        print(f"❌ Profile endpoint failed: {profile_response.status_code}")
                        print(f"   Response: {profile_response.text}")
            else:
                print(f"❌ Account endpoint failed: {account_response.status_code}")
                print(f"   Response: {account_response.text}")
                
        else:
            print(f"❌ Server not responding: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to local server")
        print("   Make sure the server is running with: cd server && npm run dev")
    except requests.exceptions.RequestException as e:
        print(f"❌ Server test error: {e}")

if __name__ == "__main__":
    print("🚀 Testing Riot API Key with modern Riot ID approach")
    print("=" * 60)
    
    # Test direct API calls
    api_success = test_riot_api()
    
    # Test local server
    test_local_server()
    
    print("\n" + "=" * 60)
    if api_success:
        print("🎉 All tests completed! Your API key is working correctly.")
        print("\nNext steps:")
        print("1. Start the server: cd server && npm run dev")
        print("2. Start the client: cd client && npm run dev")
        print("3. Test the new endpoints:")
        print("   - GET /api/account/na1/nilejr/NA1")
        print("   - GET /api/profile/na1/nilejr/NA1")
    else:
        print("❌ API key test failed. Please check your configuration.") 