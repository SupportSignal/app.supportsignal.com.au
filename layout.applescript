tell application "iTerm2"
  tell current window
    tell current tab
      -- Save reference to top pane (conversation area)
      set topPane to current session

      tell topPane
        -- Create main horizontal split (top/bottom)
        set bottomPane to split horizontally with profile "Coding"
      end tell

      -- Split bottom pane into 3 columns
      tell bottomPane
        set col2 to split vertically with profile "Coding"
        set col3 to split vertically with profile "Coding"
      end tell

      -- Now we have 4 panes: topPane, bottomPane (col1), col2, col3

      -- Split each column horizontally to create 2 rows
      tell bottomPane
        set col1_bottom to split horizontally with profile "Coding"
      end tell

      tell col2
        set col2_bottom to split horizontally with profile "Coding"
      end tell

      tell col3
        set col3_bottom to split horizontally with profile "Coding"
      end tell

      -- Now we have 7 panes total:
      -- Top: topPane (conversation)
      -- Grid: bottomPane, col2, col3 (top row)
      --       col1_bottom, col2_bottom, col3_bottom (bottom row)

      -- Small delay to ensure panes are ready
      delay 0.5

      -- Run commands in each pane
      -- Top row (servers)
      -- A = bottomPane, B = col3, C = col2
      tell bottomPane
        write text "bun run web:dev"
      end tell

      tell col3
        write text "bun run convex:dev"
      end tell

      tell col2
        write text "bun run worker:dev"
      end tell

      -- Bottom row (tests)
      -- D = col1_bottom, E = col3_bottom, F = col2_bottom
      tell col1_bottom
        write text "bun run test:web:coverage:watch"
      end tell

      tell col3_bottom
        write text "bun run test:convex:coverage:watch"
      end tell

      tell col2_bottom
        write text "bun run test:worker:coverage:watch"
      end tell
    end tell
  end tell
end tell
