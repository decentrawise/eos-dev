#pragma once
#include <eosiolib/eosio.hpp>
#include <eosiolib/transaction.hpp>
#include <eosiolib/asset.hpp>

namespace emanate {
    
    struct collab_data
    {
        account_name  name;
        uint32_t      percentage;
        std::string   fileHash;
        uint32_t      accepted;

        bool operator == (account_name n) const { return name == n; }

        EOSLIB_SERIALIZE( collab_data, (name)(percentage)(fileHash)(accepted) )
    };

    typedef eosio::vector<collab_data> approvals_t;

    struct transfer
    {
        account_name from;
        account_name to;
        eosio::asset quantity;
        std::string  memo;
        
        EOSLIB_SERIALIZE( transfer, (from)(to)(quantity)(memo) )
    };
    
    class collab : public eosio::contract 
    {
    public:
        
        collab( account_name self ):contract(self){}

        void propose(account_name proposer, eosio::name proposal_name, uint32_t price, const std::string &fileHash, approvals_t requested);
        void approve( account_name proposer, eosio::name proposal_name, account_name approver );
        void unapprove( account_name proposer, eosio::name proposal_name, account_name unapprover );
        void cancel( account_name proposer, eosio::name proposal_name, account_name canceler );
        void updatehash(account_name proposer, eosio::name proposal_name, const std::string &fileHash);
        void exec( account_name proposer, eosio::name proposal_name, account_name executer, uint32_t seconds );

    private:
        struct proposal
        {
            eosio::name name;       // Proposal name
            approvals_t approvals;  // List of approval requests
            uint32_t    price;      // Price per second
            std::string fileHash;   // Final file

            auto primary_key()const { return name.value; }
            
            EOSLIB_SERIALIZE( proposal, (name)(approvals)(price)(fileHash) )
        };

        typedef eosio::multi_index<N(proposal),proposal> proposals;
    };

} /// namespace eosio
