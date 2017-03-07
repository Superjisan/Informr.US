--[[ 
*********************************************
	CONFIGS
*********************************************
--]]

local VERIFY_TOKEN = 'XXXXX'
local PAGE_ACCESS_TOKEN = 'XXXXX'

--[[ 
*********************************************
    UTIL FUNCTIONS
*********************************************
--]]

-- define function forEach
function forEach(arr, cb) 
  for i, item in ipairs(arr) do
    cb(item, i)
  end
end

-- define map
function map(arr, cb)
    local _newtable = {}

    for i, item in ipairs(arr) do
        table.insert(_newtable, cb(item, i))
    end

    return _newtable
end

-- handle webhook verify
function verifyToken()
	local verify_token = request.query['hub.verify_token']
	if verify_token == VERIFY_TOKEN then
		return request.query['hub.challenge']	
	end
	
	return 200
end

-- is message being received 
function isValidMessage() 
	local body = json.parse(request.body)
	local object = body.object
	if object == 'page' then
		return body
	end
	
	return nil
end

-- for each event
function receivedMessage(event)

	local senderID = event.sender.id;
	
	local payload = event.postback and event.postback.payload
	if payload then
		sendInitialTextMessage(senderID)
		return true
	end
	
	local message = event.message;
	
	local attachments = message.attachments 

	if attachments then
		
		toggleTyping(senderID, 'mark_seen')
		toggleTyping(senderID, 'typing_on')
		transmitMessage(senderID, {
			text = "Sit tight! Looking up your local reps... ", 		
		})
		
		forEach(attachments, function(attachment, i)

			local type = attachment.type
			if type == 'location' then
					print('location')
				doQuery(senderID, attachment.payload)
			end
		end)
		
		return true
	end
	
	
	local messageText = message.text;
	
	if messageText then
		sendTextMessage(senderID, messageText);
	end
end

-- sendInitialTextMessage
function sendInitialTextMessage(recipientId)
	
	toggleTyping(recipientId, 'mark_seen')
	toggleTyping(recipientId, 'typing_on')
	
	transmitMessage(recipientId, {
		text = "Hello! Welcome to Informr, " ..
			"an application that allows people to inform themselves of their state legislators in an easy way. ",  		
	})
	
	transmitMessage(recipientId, {
		text = "To look up information about your local reps, please share your location by clicking the button below. \n",
		--	.. "(PS: Don\'t worry! This information is not being saved, stored, or shared anywhere.)",
		quick_replies = {{
    	content_type = "location",
    }}
	})
	
	toggleTyping(recipientId, 'typing_off')
	
end

-- doQuery
function doQuery(recipientId, payload)
	local coordinates = payload.coordinates
	local lat = coordinates.lat
	local lon = coordinates.long
	
	local resp = http.request{
		method = 'get',
		url = 'http://fewd.us/proxy.php?url=https://www.informr.us/geolookup/'..lat..'/'..lon,
		headers = { 
			["Content-Type"] = "application/json",
			["Accept"] = "application/json",
		},
	}
	
	local data = json.parse(resp.content)
	if not data then return false; end
	
	local len = 0;
	forEach(data, function(item, i)
		len = len + 1
		
		local isStateLeg = false;
		if item.chamber == 'lower' or item.chamber == 'upper' then
			isStateLeg = true;
		end
		
		local elementData = {}
		
		if isStateLeg then
		  local chamberName = ''
			if item.chamber == 'upper' then
				chamberName = 'State Senate'
			else
				chamberName = 'State Assembly'
			end
				
			elementData = {
				title = item.full_name,
				subtitle = "Chamber: " .. chamberName,
			}
			
			
			local phone1 = nil
			local phone2 = nil
		  if item.offices and item.offices[1] then
				phone1 = {
          type = "phone_number",
          title = "Call " .. item.offices[1].name,
          payload = item.offices[1].phone		
				}
			end
		  if item.offices and item.offices[2] then
				phone2 = {
          type = "phone_number",
          title = "Call " .. item.offices[2].name,
          payload = item.offices[2].phone		
				}
			end
	
			elementData.buttons = {}
			if phone1 then
				table.insert(elementData.buttons, phone1)
				
			end
			if phone2 then
				table.insert(elementData.buttons, phone2)
			end
			if item.offices[1].type == 'district' then
				table.insert(elementData.buttons, {
					title = "Office Address ("..item.offices[1].type..")",
					type = "web_url",
        	url = "http://maps.google.com/?saddr=My+Location&daddr="..item.offices[1].address,
        	webview_height_ratio = "compact",							
				})
			else
				table.insert(elementData.buttons, {
					title = "Office Address ("..item.offices[2].type..")",
					type = "web_url",
        	url = "http://maps.google.com/?saddr=My+Location&daddr="..item.offices[2].address,
        	webview_height_ratio = "compact",							
				})					
			end
			
		else
			local chamberName = item.chamber
			
			if chamberName == 'senate' then
				chamberName = 'U.S. Senator'
			else
					chamberName = 'U.S. Congressman'
			end
				
			elementData = {
				title = item.first_name .. ' ' .. item.last_name,
				subtitle = "Chamber: " .. chamberName,
			}

		  if item.phone then
				elementData.buttons = {{
          type = "phone_number",
          title = "Call " .. elementData.title,
          payload = item.phone		
				}}
			end
				
			if item.office then
				local address = {
					title = "Office Address",
					type = "web_url",
        	url = "http://maps.google.com/?saddr=My+Location&daddr="..item.office,
        	webview_height_ratio = "compact",
				}
					
				table.insert(elementData.buttons, address)
			end
				
		end
			
		if item.photo_url then
				elementData.image_url = item.photo_url
		end
			
			print(json.stringify(elementData))
			
		transmitMessage(recipientId, {
			attachment = {
				type = "template",
				payload = {
					template_type = "generic",
					image_aspect_ratio = 'square',
					elements = {elementData}, -- elements
				}, -- payload
			}, -- attachment
		})		
	end)
	
	transmitMessage(recipientId, {
		text = 'Found and listed ' .. len .. ' representatives. '
			.. 'To run again, send a message with any text or '
			.. ' tap the pin icon above your keyboard.',
	})
	toggleTyping(senderID, 'typing_off')
	
end

-- sendTextMessage
function sendTextMessage(recipientId, messageText)
	
	toggleTyping(recipientId, 'typing_on')
	--[[transmitMessage(recipientId, {
      text = "To look up information about your local reps, please share your location by clicking the button below.",
				--.. "(PS: Don\'t worry! This information is not being saved, stored, or shared anywhere.)",
  })
	transmitMessage(recipientId, {
		attachment = {
			type = 'image',
			payload = {
				url = "https://github.com/mottaquikarim/Informr.US/blob/master/locationHint.gif?raw=true"		
			},
		}
	})
	transmitMessage(recipientId, {
      text = "(PS: Don\'t worry! This information is not being saved, stored, or shared anywhere.)",
  })]]--
	transmitMessage(recipientId, {
		text = "To look up information about your local reps, please share your location by clicking the button below. \n",
		--	.. "(PS: Don\'t worry! This information is not being saved, stored, or shared anywhere.)",
		quick_replies = {{
    	content_type = "location",
    }}
	})
	toggleTyping(recipientId, 'typing_off')
	
end

-- toggleTyping
function toggleTyping(recipientId, action)
	makeAPICall({
		recipient = {
      id = recipientId
    },
		sender_action = action,
	})
end

-- transmit message
function transmitMessage(recipientId, payload) 
	makeAPICall({
		recipient = {
      id = recipientId
    },
		message = payload,
	})	
end


-- make API call
function makeAPICall(messageData)
	local sendMessage = http.request{
		url = 'https://graph.facebook.com/v2.6/me/messages',
		method = 'post',
		params = {
			access_token = PAGE_ACCESS_TOKEN,	
		},
		data = json.stringify(messageData),
		headers = { 
			["Content-Type"] = "application/json",
			["Accept"] = "application/json",
		},
	}
	
	local resp = json.parse(sendMessage.content)
	local recipientId = resp.recipient_id;
  local messageId = resp.message_id;
		
end

--[[ 
*********************************************
	  IMPLEMENTATION OF SCRIPT TASKS
*********************************************
--]]

-- if GET, prove authenticity
if request.method == 'GET' then
	return verifyToken()	
end

-- if POST, hande messaging
if request.method == 'POST' then

	local body =  isValidMessage()
	
	if not body then
		return 200
	end
	
    -- grab each entry
    local entries = map(body.entry(function(entry, i)
        return entry.messaging
    end)

    -- call kickstarting method
    local events = map(entries, function(event, j)
        if event.message or event.postback then
		    receivedMessage(event)
        end
    end)

end -- if

return 200
