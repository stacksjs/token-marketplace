document.addEventListener('DOMContentLoaded', function() {
  var MINT_API = window.API_BASE || 'http://localhost:3008'

  var toggleBtn = document.querySelector('[data-mint-toggle]')
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var form = document.querySelector('[data-mint-form]')
      if (form) form.style.display = form.style.display === 'none' ? '' : 'none'
    })
  }

  var submitBtn = document.querySelector('[data-mint-submit]')
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var nameEl = document.querySelector('[data-mint-name]')
      var descEl = document.querySelector('[data-mint-description]')
      var imageEl = document.querySelector('[data-mint-image]')
      var symbolEl = document.querySelector('[data-mint-symbol]')
      var statusEl = document.querySelector('[data-mint-status]')
      var collectionMint = submitBtn.dataset.collectionMint

      var nftName = nameEl ? nameEl.value.trim() : ''
      if (!nftName) {
        alert('NFT name is required')
        return
      }

      submitBtn.disabled = true
      submitBtn.textContent = 'Minting on-chain...'
      if (statusEl) {
        statusEl.style.display = ''
        statusEl.textContent = 'Sending transaction to Solana devnet...'
        statusEl.style.color = '#6b7280'
      }

      fetch(MINT_API + '/marketplace/nfts/mint-to-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionMint: collectionMint,
          name: nftName,
          description: descEl ? descEl.value.trim() : '',
          imageUrl: imageEl ? imageEl.value.trim() : '',
          symbol: symbolEl ? symbolEl.value.trim() : ''
        })
      })
      .then(function(res) { return res.json() })
      .then(function(data) {
        if (data.error) {
          if (statusEl) {
            statusEl.textContent = data.error + (data.hint ? ' - ' + data.hint : '')
            statusEl.style.color = '#dc2626'
          }
          alert(data.error)
        } else {
          if (statusEl) {
            statusEl.textContent = 'Minted! Mint address: ' + data.nft.mintAddress
            statusEl.style.color = '#059669'
          }
          alert('NFT minted successfully!')
          if (nameEl) nameEl.value = ''
          if (descEl) descEl.value = ''
          if (imageEl) imageEl.value = ''
          if (symbolEl) symbolEl.value = ''
          setTimeout(function() { window.location.reload() }, 2000)
        }
        submitBtn.disabled = false
        submitBtn.textContent = 'Mint NFT On-Chain'
      })
      .catch(function(err) {
        console.error('Mint failed:', err)
        if (statusEl) {
          statusEl.textContent = 'Failed to mint NFT. Check console.'
          statusEl.style.color = '#dc2626'
        }
        submitBtn.disabled = false
        submitBtn.textContent = 'Mint NFT On-Chain'
      })
    })
  }
})
