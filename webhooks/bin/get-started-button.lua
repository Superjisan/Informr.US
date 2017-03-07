--[[
	https://developers.facebook.com/docs/messenger-platform/thread-settings/get-started-button
--]]

local isActivated = false;

if not isActivated then
	return 404
end


local PAGE_ACCESS_TOKEN = 'XXXXXXX'

local request = http.request{
url = 'https://graph.facebook.com/v2.6/me/thread_settings',
		method = 'post',
		params = {
			access_token = PAGE_ACCESS_TOKEN,	
		},
		data = json.stringify({
  		setting_type = "call_to_actions",
  		thread_state = "new_thread",
  		call_to_actions = {{
				payload = "USER_DEFINED_PAYLOAD",
    	}}
		}),
		headers = { 
			["Content-Type"] = "application/json",
			["Accept"] = "application/json",
		},		
}

