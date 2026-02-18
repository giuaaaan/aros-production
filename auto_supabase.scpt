-- AROS - AppleScript Automation per Supabase
-- Automazione UI legittima sul proprio Mac

property sqlFilePath : "/Users/romanogiovanni1993gmail.com/Desktop/PROGETTI/ai-aros-production/COMPLETE_SETUP.sql"
property supabaseURL : "https://supabase.com/dashboard/project/elruhdwcrsxeirbbsozd/sql/new"

-- Funzione principale
on run
	display dialog "🚀 AROS - Automazione Supabase" & return & return & "Questo script:" & return & "1. Apre Safari" & return & "2. Carica il SQL Editor di Supabase" & return & "3. Copia il file SQL negli appunti" & return & "4. Ti guida ad incollare ed eseguire" & return & return & "Assicurati di essere già loggato su Supabase!" buttons {"Annulla", "Avvia"} default button "Avvia"
	
	if button returned of result is "Avvia" then
		main()
	end if
end run

on main()
	try
		-- Step 1: Leggi il file SQL
		display notification "Caricamento SQL..." with title "AROS Automation"
		
		set sqlContent to read file (sqlFilePath as POSIX file)
		set sqlLength to length of sqlContent
		
		display dialog "📄 File SQL caricato" & return & "Dimensione: " & (sqlLength / 1024 as integer) & " KB" & return & "Linee: ~1900" buttons {"OK"} default button "OK"
		
		-- Step 2: Copia negli appunti
		set the clipboard to sqlContent
		display notification "SQL copiato negli appunti!" with title "AROS Automation"
		
		-- Step 3: Apri Safari
		tell application "Safari"
			activate
			delay 1
			
			-- Apri nuova finestra se necessario
			if (count of windows) is 0 then
				make new document
				delay 1
			end if
			
			-- Carica URL
			set URL of front document to supabaseURL
		end tell
		
		display dialog "🌐 Safari aperto!" & return & return & "Ora devi:" & return & "1. Assicurarti di essere loggato su Supabase" & return & "2. Aspettare che carichi l'SQL Editor" & return & "3. Cliccare OK quando vedi l'editor bianco" buttons {"OK"} default button "OK"
		
		-- Step 4: Automazione tasti
		tell application "System Events"
			-- Assicurati Safari sia attivo
			tell application "Safari" to activate
			delay 2
			
			-- Clicca al centro dello schermo (dove dovrebbe essere l'editor)
			-- Coordinate per schermo 1920x1080 o simili
			-- Modifica queste se hai schermo diverso
			set screenWidth to 1920
			set screenHeight to 1080
			set clickX to screenWidth / 2
			set clickY to screenHeight / 2 + 100 -- un po' più in basso del centro
			
			display dialog "🖱️ Procedura automatica:" & return & return & "1. Cliccherò al centro dello schermo" & return & "2. Selezionerò tutto (CMD+A)" & return & "3. Incollerò il SQL (CMD+V)" & return & return & "IMPORTANTE:" & return & "Non muovere il mouse durante l'esecuzione!" & return & return & "Pronto?" buttons {"Annulla", "Esegui"} default button "Esegui"
			
			if button returned of result is "Esegui" then
				-- Clicca nel punto
				click at {clickX, clickY}
				delay 1
				
				-- Seleziona tutto
				key code 0 using {command down} -- CMD+A
				delay 0.5
				
				-- Cancella
				key code 51 -- Delete
				delay 0.5
				
				-- Incolla
				key code 9 using {command down} -- CMD+V
				
				display notification "SQL incollato! Clicca RUN in Supabase" with title "AROS Automation"
				
				display dialog "✅ Completato!" & return & return & "Ora devi solo:" & return & "1. Cliccare il bottone RUN (▶) in alto a destra su Supabase" & return & "2. Aspettare l'esecuzione (10-20 secondi)" buttons {"OK"} default button "OK"
			end if
		end tell
		
	on error errMsg
		display dialog "❌ Errore: " & errMsg buttons {"OK"} default button "OK"
	end try
end main
